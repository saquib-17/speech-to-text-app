import { GoogleGenAI } from "@google/genai";
import env from "../config/env.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * SpeechScribe AI v2 — AI Intelligence Service (Gemini 3.8 Flash Interactions API)
 *
 * Reliability & Resilience Architecture:
 * - Powered by Google Gemini 3.8 Flash (Free Tier: 20 req/day per project limit).
 * - Strictly optional: If GEMINI_API_KEY is omitted, returns graceful error and local transcription continues.
 * - Distinguishes 503 (model overload), 429 (quota limit), 504 (timeout), 401/403 (auth), 400 (bad request).
 * - Smart Retry: Exponential backoff with jitter for transient 503/504 errors (max 2 retries, short delays).
 * - Configurable Model Fallback: Optional GEMINI_FALLBACK_MODEL used only when primary 503 exhausts retries.
 * - Request Timeout: Per-call timeout guard (default 15s) prevents indefinite hanging.
 * - Strict Separation: 503 overload errors NEVER trigger the daily 429 quota cooldown.
 */

// Cached GoogleGenAI client instance
let genAIClient = null;

// In-memory mock response for tests
let mockAIResponse = null;
let forcePassthroughInTest = false;

// In-memory Quota Cooldown tracking
let quotaCooldownUntil = null; // Timestamp (ms)
let quotaStatusCache = null;

// Helper: Sleep utility
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sets mock AI response for deterministic testing
 * @param {Object} response
 */
export const setMockAIResponse = (response) => {
  mockAIResponse = response;
};

/**
 * Resets mock AI response
 */
export const resetMockAIResponse = () => {
  mockAIResponse = null;
  forcePassthroughInTest = false;
};

/**
 * Allows test environment to execute full callGemini flow with mocked client
 * @param {boolean} [enable=true]
 */
export const setMockAIPassthrough = (enable = true) => {
  forcePassthroughInTest = enable;
};

/**
 * Sets an active quota cooldown (in seconds)
 * @param {number} durationSeconds
 * @param {string} [customMessage]
 */
export const setQuotaCooldown = (durationSeconds, customMessage = null) => {
  const seconds = Math.max(1, Math.ceil(durationSeconds || 60));
  quotaCooldownUntil = Date.now() + seconds * 1000;
  quotaStatusCache = {
    isCooldownActive: true,
    retryAfter: seconds,
    retryAt: new Date(quotaCooldownUntil).toISOString(),
    message:
      customMessage ||
      "Daily Gemini AI request limit reached (20 requests/day free tier). AI summaries and Q&A will resume once the quota resets.",
  };
};

/**
 * Clears any active quota cooldown
 */
export const resetQuotaCooldown = () => {
  quotaCooldownUntil = null;
  quotaStatusCache = null;
};

/**
 * Returns current quota cooldown status
 * @returns {{ isCooldownActive: boolean, retryAfter: number | null, retryAt: string | null, message: string | null }}
 */
export const getQuotaStatus = () => {
  const now = Date.now();
  if (quotaCooldownUntil && quotaCooldownUntil > now) {
    const remainingSeconds = Math.ceil((quotaCooldownUntil - now) / 1000);
    return {
      isCooldownActive: true,
      retryAfter: remainingSeconds,
      retryAt: new Date(quotaCooldownUntil).toISOString(),
      message:
        quotaStatusCache?.message ||
        "Daily Gemini AI request limit reached. AI summaries and Q&A will resume once the quota resets.",
    };
  }

  // Cooldown expired
  if (quotaCooldownUntil && quotaCooldownUntil <= now) {
    quotaCooldownUntil = null;
    quotaStatusCache = null;
  }

  return {
    isCooldownActive: false,
    retryAfter: null,
    retryAt: null,
    message: null,
  };
};

/**
 * Extracts retry-after seconds from response headers or RetryInfo details
 * @param {any} err
 * @returns {number | null}
 */
export const extractRetryAfterSeconds = (err) => {
  if (!err) return null;
  const rawHeader =
    err.headers?.get?.("retry-after") ||
    err.headers?.["retry-after"] ||
    err.response?.headers?.["retry-after"];
  if (rawHeader) {
    const parsedNum = parseInt(rawHeader, 10);
    if (!isNaN(parsedNum) && parsedNum > 0) return parsedNum;
    const parsedDate = Date.parse(rawHeader);
    if (!isNaN(parsedDate) && parsedDate > Date.now()) {
      return Math.ceil((parsedDate - Date.now()) / 1000);
    }
  }
  const details = err.details || err.error?.details || [];
  if (Array.isArray(details)) {
    for (const d of details) {
      if (d?.["@type"]?.includes("RetryInfo") && d.retryDelay) {
        const match = String(d.retryDelay).match(/([\d.]+)\s*s?/i);
        if (match) return Math.ceil(parseFloat(match[1]));
      }
    }
  }
  return null;
};

/**
 * Checks if an error is a temporary/transient server error that can be retried.
 * Explicitly distinguishes temporary 503/504 server overload from 429 quota exhaustion,
 * 401 authentication errors, and 400 bad requests.
 *
 * @param {any} err
 * @returns {boolean}
 */
export const isTemporaryServerError = (err) => {
  if (!err) return false;

  // 1. Quota errors (429) must NEVER be retried in the transient loop
  if (err.statusCode === HTTP_STATUS.TOO_MANY_REQUESTS || err.isQuotaExceeded) return false;
  if (extractQuotaErrorDetails(err)) return false;

  const status = Number(err.status || err.statusCode || err.response?.status || err.error?.code);
  const statusStr = String(err.status || err.error?.status || "");
  const message = `${err.message || ""} ${err.error?.message || ""}`.toLowerCase();

  // 2. Client/auth/validation/not-found errors are non-retryable
  if (status === 400 || status === 401 || status === 403 || status === 404) return false;
  if (
    message.includes("api_key_invalid") ||
    message.includes("api key not valid") ||
    message.includes("permission_denied") ||
    message.includes("unauthorized")
  ) {
    return false;
  }
  if (
    message.includes("invalid_argument") ||
    message.includes("bad request") ||
    message.includes("not found") ||
    message.includes("no longer available")
  ) {
    return false;
  }

  // 3. 503 Service Unavailable / High demand / Model overloaded
  if (
    status === 503 ||
    statusStr.includes("503") ||
    statusStr.includes("UNAVAILABLE") ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("service_unavailable")
  ) {
    return true;
  }

  // 4. 502 Bad Gateway, 504 Deadline Exceeded, or AbortError / Timeout
  if (
    status === 502 ||
    status === 504 ||
    statusStr.includes("DEADLINE_EXCEEDED") ||
    message.includes("deadline_exceeded") ||
    message.includes("gateway timeout") ||
    err.name === "AbortError" ||
    message.includes("timed out") ||
    err.code === "ETIMEDOUT" ||
    err.code === "ECONNRESET"
  ) {
    return true;
  }

  return false;
};

/**
 * Parses upstream Google GenAI errors to detect 429 quota exhaustion
 * and extract retry delay/timestamp when provided by Google.
 *
 * @param {any} err
 * @returns {{ isQuota: boolean, retryAfterSeconds: number, retryAt: string, friendlyMessage: string } | null}
 */
export const extractQuotaErrorDetails = (err) => {
  if (!err) return null;

  const status = Number(err.status || err.statusCode || err.code || err.response?.status);
  const message = `${err.message || ""} ${err.error?.message || ""}`;

  const is429 = status === 429;
  const isResourceExhausted =
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("Resource has been exhausted") ||
    err.error?.status === "RESOURCE_EXHAUSTED";
  const isQuotaKeyword =
    message.toLowerCase().includes("quota exceeded") ||
    message.toLowerCase().includes("check quota") ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("rate_limit_exceeded") ||
    message.toLowerCase().includes("too many requests");

  let hasQuotaDetail = false;
  let retryInfoDelaySeconds = null;

  const details = err.details || err.error?.details || [];
  if (Array.isArray(details)) {
    for (const d of details) {
      if (d?.reason === "RATE_LIMIT_EXCEEDED" || d?.reason === "RESOURCE_EXHAUSTED") {
        hasQuotaDetail = true;
      }
      if (d?.["@type"]?.includes("RetryInfo") && d.retryDelay) {
        hasQuotaDetail = true;
        const match = String(d.retryDelay).match(/([\d.]+)\s*s?/i);
        if (match) {
          retryInfoDelaySeconds = Math.ceil(parseFloat(match[1]));
        }
      }
    }
  }

  const isQuota = is429 || isResourceExhausted || isQuotaKeyword || hasQuotaDetail;
  if (!isQuota) return null;

  let retrySeconds = retryInfoDelaySeconds || extractRetryAfterSeconds(err);

  // 2. Parse retry string from message (e.g. "Please retry after 1h 24m" or "Please retry after 45s")
  if (!retrySeconds) {
    const hmsMatch = message.match(/retry after (?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i);
    if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
      const hours = parseInt(hmsMatch[1] || "0", 10);
      const minutes = parseInt(hmsMatch[2] || "0", 10);
      const seconds = parseInt(hmsMatch[3] || "0", 10);
      const totalSec = hours * 3600 + minutes * 60 + seconds;
      if (totalSec > 0) retrySeconds = totalSec;
    }
  }

  if (!retrySeconds) {
    const unitMatch = message.match(
      /retry (?:in|after) ([\d.]+)\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours)/i
    );
    if (unitMatch) {
      const val = parseFloat(unitMatch[1]);
      const unit = unitMatch[2].toLowerCase();
      if (unit.startsWith("h")) retrySeconds = Math.ceil(val * 3600);
      else if (unit.startsWith("m")) retrySeconds = Math.ceil(val * 60);
      else retrySeconds = Math.ceil(val);
    }
  }

  if (!retrySeconds) {
    const delayMatch = message.match(/retry_?delay["']?\s*:\s*["']?([\d.]+)\s*s?/i);
    if (delayMatch) {
      retrySeconds = Math.ceil(parseFloat(delayMatch[1]));
    }
  }

  // 3. Fallback for daily quota limits (calculates seconds until next UTC midnight reset)
  const isDailyLimit =
    message.toLowerCase().includes("per day") ||
    message.toLowerCase().includes("daily") ||
    message.toLowerCase().includes("generatecontent requests per project per day") ||
    message.toLowerCase().includes("limit '20'") ||
    message.toLowerCase().includes("free tier");

  if (!retrySeconds && isDailyLimit) {
    const now = new Date();
    const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 5));
    retrySeconds = Math.max(60, Math.ceil((nextReset.getTime() - now.getTime()) / 1000));
  } else if (!retrySeconds) {
    retrySeconds = 60; // 60s standard minimum cooldown
  }

  const retryAt = new Date(Date.now() + retrySeconds * 1000).toISOString();

  let friendlyMessage;
  if (isDailyLimit || retrySeconds >= 1800) {
    friendlyMessage =
      "Daily Gemini AI request limit reached (20 requests/day free tier). AI summaries and Q&A will resume once the quota resets.";
  } else {
    friendlyMessage =
      "Gemini AI request quota temporarily exceeded. Please wait for the cooldown period to complete.";
  }

  return {
    isQuota: true,
    retryAfterSeconds: retrySeconds,
    retryAt,
    friendlyMessage,
  };
};

/**
 * Checks if the Gemini AI service is enabled.
 * @returns {boolean}
 */
export const isAIConfigured = () => {
  return Boolean(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY);
};

/**
 * Retrieves or initializes the GoogleGenAI client singleton.
 * @returns {GoogleGenAI}
 */
export const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error(
      "Gemini AI features are not configured. To enable AI summaries and Q&A, set GEMINI_API_KEY in your server environment."
    );
    error.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    throw error;
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }

  return genAIClient;
};

/**
 * Override the GoogleGenAI client instance (useful for unit tests and mocking)
 * @param {GoogleGenAI|null} client
 */
export const setGenAIClient = (client) => {
  genAIClient = client;
};

/**
 * Sanitizes strings to prevent accidental leakage of API keys or secrets in logs
 * @param {string} text
 * @returns {string}
 */
export const sanitizeLogMessage = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/AQ\.[A-Za-z0-9_-]{20,}/g, "[REDACTED_API_KEY]")
    .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_API_KEY]")
    .replace(/(?:key|apiKey|api_key)=([a-zA-Z0-9_\-\.]+)/gi, "key=[REDACTED]");
};

/**
 * Structured diagnostic logger for Gemini API attempts
 * @param {string} phase
 * @param {Object} info
 */
export const logGeminiDiagnostic = (phase, info) => {
  const sanitizedMsg = sanitizeLogMessage(info.message || "");
  console.warn(
    `[Gemini Diagnostics] ${phase} | Model: ${info.model} | Attempt: ${info.attempt} | Status: ${info.status ?? "N/A"} | Code: ${info.code ?? "N/A"} | Elapsed: ${info.elapsedMs}ms | Message: ${sanitizedMsg}`
  );
};

/**
 * Executes a single API call to a specific Gemini model via the Interactions API
 * with explicit hard timeout protection (Promise.race) and maxRetries: 0 to prevent
 * Speakeasy/SDK internal background retries from stacking latency.
 *
 * @param {GoogleGenAI} aiClient
 * @param {string} modelName
 * @param {string} prompt
 * @param {Object} options
 * @param {number} timeoutMs
 * @returns {Promise<string>}
 */
const executeSingleInteraction = async (aiClient, modelName, prompt, options, timeoutMs) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const timeoutErr = new Error(`Request to Gemini model '${modelName}' timed out after ${timeoutMs}ms.`);
      timeoutErr.statusCode = 504;
      timeoutErr.status = 504;
      timeoutErr.code = "ETIMEDOUT";
      timeoutErr.name = "TimeoutError";
      reject(timeoutErr);
    }, timeoutMs);
  });

  try {
    const apiPromise = aiClient.interactions.create(
      {
        model: modelName,
        input: prompt,
        generation_config: {
          temperature: options.temperature ?? 0.3,
          max_output_tokens: options.maxOutputTokens ?? 1500,
        },
      },
      { timeout: timeoutMs, maxRetries: 0 }
    );

    const interaction = await Promise.race([apiPromise, timeoutPromise]);
    clearTimeout(timer);

    const outputText = interaction?.output_text;
    if (!outputText || typeof outputText !== "string" || outputText.trim() === "") {
      const emptyErr = new Error(`No response generated by Gemini model '${modelName}'.`);
      emptyErr.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      throw emptyErr;
    }

    return outputText.trim();
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Executes model call with smart exponential backoff retry for transient server errors
 * @param {GoogleGenAI} aiClient
 * @param {string} modelName
 * @param {string} prompt
 * @param {Object} options
 * @param {number} timeoutMs
 * @param {number} maxRetries
 * @param {string} [phase="Primary"]
 * @returns {Promise<string>}
 */
const executeWithRetries = async (aiClient, modelName, prompt, options, timeoutMs, maxRetries, phase = "Primary") => {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();
    try {
      return await executeSingleInteraction(aiClient, modelName, prompt, options, timeoutMs);
    } catch (err) {
      const elapsedMs = Date.now() - startTime;
      lastError = err;

      const status = err.status || err.statusCode || err.response?.status || (err.name === "TimeoutError" ? 504 : null);
      const code = err.error?.code || err.code || "ERR";

      logGeminiDiagnostic(phase, {
        model: modelName,
        attempt: `${attempt + 1}/${maxRetries + 1}`,
        status,
        code,
        elapsedMs,
        message: err.message || err.error?.message || "",
      });

      // Abort immediately on quota exhaustion or non-transient errors
      if (err.statusCode === 429 || err.isQuotaExceeded || extractQuotaErrorDetails(err)) {
        throw err;
      }
      if (!isTemporaryServerError(err)) {
        throw err;
      }

      // If maximum attempts exhausted, exit loop to allow fallback or error translation
      if (attempt === maxRetries) {
        console.warn(
          `[Gemini] Final attempt ${attempt + 1}/${maxRetries + 1} for model '${modelName}' failed with temporary error (${err.message || "503/Timeout"}). All retries exhausted.`
        );
        break;
      }

      // Calculate backoff with jitter
      let delayMs;
      if (process.env.NODE_ENV === "test") {
        delayMs = 1;
      } else {
        const retryAfterSec = extractRetryAfterSeconds(err);
        if (retryAfterSec && retryAfterSec > 0 && retryAfterSec <= 5) {
          delayMs = retryAfterSec * 1000;
        } else {
          // Exponential backoff: base 800ms * 2^attempt + random jitter (0-400ms)
          const base = 800 * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * 400);
          delayMs = base + jitter;
        }
      }

      console.warn(
        `[Gemini] Attempt ${attempt + 1}/${maxRetries + 1} for model '${modelName}' failed with temporary error (${err.message || "503/Timeout"}). Retrying in ${delayMs}ms...`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
};

/**
 * Call Google Gemini via Google GenAI Interactions API with smart retries,
 * optional model fallback, and request timeout protection.
 *
 * @param {string} prompt - Prompt instruction and context
 * @param {Object} [options] - Generation options
 * @param {number} [options.temperature=0.3] - Sampling temperature
 * @param {number} [options.maxOutputTokens=1500] - Max output token limit
 * @param {number} [options.timeoutMs] - Per-call timeout limit in milliseconds (default: 15s)
 * @param {number} [options.maxRetries] - Maximum retry attempts on 503 (default: 2)
 * @returns {Promise<string>} Model text output
 */
export const callGemini = async (prompt, options = {}) => {
  // 1. Quota Guard: Immediately reject repeated calls while quota cooldown is active
  const quota = getQuotaStatus();
  if (quota.isCooldownActive) {
    const quotaError = new Error(quota.message);
    quotaError.statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
    quotaError.retryAfter = quota.retryAfter;
    quotaError.retryAt = quota.retryAt;
    quotaError.isQuotaExceeded = true;
    throw quotaError;
  }

  const primaryModel = process.env.GEMINI_MODEL || env.GEMINI_MODEL || "gemini-3.8-flash";
  const fallbackModel =
    (process.env.GEMINI_FALLBACK_MODEL || (process.env.NODE_ENV === "test" ? "" : env.GEMINI_FALLBACK_MODEL) || "").trim() ||
    null;
  const timeoutMs = options.timeoutMs ?? env.GEMINI_TIMEOUT_MS ?? 15000;
  const maxRetries = options.maxRetries ?? env.GEMINI_MAX_RETRIES ?? 2;

  const ai = getGenAIClient();
  let primaryError = null;

  // Phase 1: Attempt Primary Model with Smart Retries
  try {
    return await executeWithRetries(ai, primaryModel, prompt, options, timeoutMs, maxRetries, "Primary");
  } catch (err) {
    primaryError = err;
  }

  // 2. Handle Quota-Exceeded Responses (HTTP 429) — Never retry or fallback
  if (primaryError.statusCode === 429 || primaryError.isQuotaExceeded) {
    throw primaryError;
  }
  const quotaDetails = extractQuotaErrorDetails(primaryError);
  if (quotaDetails) {
    setQuotaCooldown(quotaDetails.retryAfterSeconds, quotaDetails.friendlyMessage);
    const quotaErr = new Error(quotaDetails.friendlyMessage);
    quotaErr.statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
    quotaErr.retryAfter = quotaDetails.retryAfterSeconds;
    quotaErr.retryAt = quotaDetails.retryAt;
    quotaErr.isQuotaExceeded = true;
    throw quotaErr;
  }

  // 3. Handle Authentication Errors (HTTP 401/403) — Never fallback
  if (
    primaryError.status === 401 ||
    primaryError.status === 403 ||
    primaryError.message?.includes("API_KEY_INVALID") ||
    primaryError.message?.includes("API key not valid") ||
    primaryError.message?.includes("PERMISSION_DENIED")
  ) {
    const authErr = new Error("Invalid Gemini API key. Please verify your GEMINI_API_KEY environment variable.");
    authErr.statusCode = HTTP_STATUS.UNAUTHORIZED;
    throw authErr;
  }

  // 4. Handle Bad Request / Deprecated model (HTTP 400/404) — Never fallback
  if (
    primaryError.status === 400 ||
    primaryError.status === 404 ||
    primaryError.message?.includes("not found") ||
    primaryError.message?.includes("no longer available")
  ) {
    const modelErr = new Error(`Gemini model '${primaryModel}' is unavailable or deprecated: ${primaryError.message}`);
    modelErr.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw modelErr;
  }

  // 5. Phase 2: If primary failed with temporary 503/504 server overload, check if fallback is configured
  const isPrimaryTemporary = isTemporaryServerError(primaryError);

  if (isPrimaryTemporary && fallbackModel && fallbackModel !== primaryModel) {
    console.warn(
      `[Gemini] Primary model '${primaryModel}' unavailable after retries (${primaryError.message}). Attempting configured fallback model '${fallbackModel}'...`
    );

    try {
      return await executeWithRetries(ai, fallbackModel, prompt, options, timeoutMs, maxRetries, "Fallback");
    } catch (fallbackErr) {
      console.error(`[Gemini] Fallback model '${fallbackModel}' also failed: ${fallbackErr.message}`);

      // Check if fallback encountered quota exhaustion
      const fbQuota = extractQuotaErrorDetails(fallbackErr);
      if (fbQuota) {
        setQuotaCooldown(fbQuota.retryAfterSeconds, fbQuota.friendlyMessage);
        const quotaErr = new Error(fbQuota.friendlyMessage);
        quotaErr.statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
        quotaErr.retryAfter = fbQuota.retryAfterSeconds;
        quotaErr.retryAt = fbQuota.retryAt;
        quotaErr.isQuotaExceeded = true;
        throw quotaErr;
      }

      const dualError = new Error(
        `Gemini AI service is currently experiencing high demand across both primary ('${primaryModel}') and fallback ('${fallbackModel}') models. Please try again later.`
      );
      dualError.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw dualError;
    }
  }

  // 6. Phase 3: No fallback configured or fallback not applicable — return clean error
  if (
    primaryError.status === 503 ||
    primaryError.message?.includes("503") ||
    primaryError.message?.includes("high demand") ||
    primaryError.message?.includes("service_unavailable") ||
    primaryError.message?.includes("overloaded") ||
    isPrimaryTemporary
  ) {
    if (
      primaryError.name === "AbortError" ||
      primaryError.message?.includes("timed out") ||
      primaryError.code === "ETIMEDOUT" ||
      primaryError.status === 504
    ) {
      const timeoutErr = new Error(
        `AI generation timed out (${Math.round(timeoutMs / 1000)}s limit exceeded). The AI service may be experiencing delays.`
      );
      timeoutErr.statusCode = 504;
      throw timeoutErr;
    }

    const unavailableErr = new Error(
      "Gemini 3.8 Flash is currently experiencing high demand. Please try again later."
    );
    unavailableErr.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    throw unavailableErr;
  }

  // Handle general abort / timeout errors
  if (primaryError.name === "AbortError" || primaryError.message?.includes("timed out") || primaryError.code === "ETIMEDOUT") {
    const timeoutErr = new Error(`AI generation timed out (${Math.round(timeoutMs / 1000)}s limit exceeded).`);
    timeoutErr.statusCode = 504;
    throw timeoutErr;
  }

  // General fallback
  const genericErr = new Error(`AI generation failed: ${primaryError.message || "Unknown error"}`);
  genericErr.statusCode = primaryError.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  throw genericErr;
};

/**
 * Generate structured summary, key points, and action items from a transcript.
 *
 * @param {string} transcriptText - The raw transcript text
 * @returns {Promise<{ summary: string, keyPoints: string[], actionItems: string[] }>}
 */
export const generateSummary = async (transcriptText) => {
  if (!transcriptText || typeof transcriptText !== "string" || transcriptText.trim() === "") {
    const error = new Error("Cannot generate summary for empty transcript text.");
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  // Quota Guard: Check if quota cooldown is active
  const quota = getQuotaStatus();
  if (quota.isCooldownActive) {
    const quotaError = new Error(quota.message);
    quotaError.statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
    quotaError.retryAfter = quota.retryAfter;
    quotaError.retryAt = quota.retryAt;
    quotaError.isQuotaExceeded = true;
    throw quotaError;
  }

  // Fast-path for test environment
  if (process.env.NODE_ENV === "test" && !forcePassthroughInTest) {
    if (mockAIResponse) return mockAIResponse;
    return {
      summary: "This is an automated test summary of the recorded transcription.",
      keyPoints: [
        "First key discussion topic regarding system architecture.",
        "Second key finding from local speech recognition benchmarking.",
      ],
      actionItems: [
        "Verify all integration tests pass.",
        "Confirm zero-cost constraints are preserved.",
      ],
    };
  }

  const prompt = `You are an expert AI meeting analyst and summarizer.
Analyze the following transcript carefully and produce a comprehensive, structured summary.

Transcript:
"""
${transcriptText}
"""

Format your response strictly as valid, parseable JSON with the following schema:
{
  "summary": "Concise 2-3 paragraph executive summary of the discussion.",
  "keyPoints": [
    "Key takeaway point 1",
    "Key takeaway point 2"
  ],
  "actionItems": [
    "Actionable next step 1 (if any, otherwise empty array)"
  ]
}

Respond ONLY with valid JSON. Do not include markdown code block syntax (like \`\`\`json) or extra commentary.`;

  const rawOutput = await callGemini(prompt, { temperature: 0.2 });

  // Clean possible markdown code fences if Gemini included them
  let cleaned = rawOutput.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "Summary generated.",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    };
  } catch {
    // Graceful fallback if JSON parsing failed
    return {
      summary: cleaned,
      keyPoints: [],
      actionItems: [],
    };
  }
};

/**
 * Answer a user's contextual question grounded strictly in the transcript.
 *
 * @param {string} transcriptText - The raw transcript text
 * @param {string} question - The user's question
 * @returns {Promise<{ answer: string, question: string }>}
 */
export const answerQuestion = async (transcriptText, question) => {
  if (!transcriptText || typeof transcriptText !== "string" || transcriptText.trim() === "") {
    const error = new Error("Cannot answer questions over an empty transcript.");
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  if (!question || typeof question !== "string" || question.trim() === "") {
    const error = new Error("Question parameter is required and cannot be empty.");
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  // Quota Guard: Check if quota cooldown is active
  const quota = getQuotaStatus();
  if (quota.isCooldownActive) {
    const quotaError = new Error(quota.message);
    quotaError.statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
    quotaError.retryAfter = quota.retryAfter;
    quotaError.retryAt = quota.retryAt;
    quotaError.isQuotaExceeded = true;
    throw quotaError;
  }

  // Fast-path for test environment
  if (process.env.NODE_ENV === "test" && !forcePassthroughInTest) {
    if (mockAIResponse?.answer) {
      return {
        question: question.trim(),
        answer: mockAIResponse.answer,
      };
    }
    return {
      question: question.trim(),
      answer: `Mock answer for question: "${question.trim()}". Grounded in transcript content.`,
    };
  }

  const prompt = `You are an AI assistant answering questions based strictly on the provided transcript.
Do not invent or assume information not present in the transcript. If the transcript does not contain the answer, politely state that the recording does not mention that topic.

Transcript:
"""
${transcriptText}
"""

Question:
"${question.trim()}"

Provide a clear, accurate, and concise answer directly based on the transcript content.`;

  const answer = await callGemini(prompt, { temperature: 0.2 });

  return {
    question: question.trim(),
    answer,
  };
};

/**
 * Common language code to full language name map
 */
const LANGUAGE_CODES_TO_NAMES = {
  en: "English",
  hi: "Hindi",
  kn: "Kannada",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  mr: "Marathi",
  bn: "Bengali",
  ur: "Urdu",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ja: "Japanese",
  zh: "Chinese",
  ar: "Arabic",
  it: "Italian",
  ru: "Russian",
  ko: "Korean",
  gu: "Gujarati",
  pa: "Punjabi",
  nl: "Dutch",
};

/**
 * Resolves a language code or name to a normalized language name
 * @param {string} lang
 * @returns {string}
 */
export const resolveLanguageName = (lang) => {
  if (!lang || typeof lang !== "string") return "English";
  const trimmed = lang.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "auto") return "auto";
  if (LANGUAGE_CODES_TO_NAMES[lower]) return LANGUAGE_CODES_TO_NAMES[lower];
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

/**
 * Translate a complete transcript to a specified target language using Gemini AI.
 * Preserves original meaning, context, paragraph breaks, and speaker labels.
 *
 * @param {string} transcriptText - The raw transcript text
 * @param {string} targetLanguage - Target language name or code
 * @param {string} [sourceLanguage="auto"] - Source language name or "auto"
 * @returns {Promise<{ translatedText: string, targetLanguage: string, sourceLanguage: string }>}
 */
export const translateTranscript = async (transcriptText, targetLanguage, sourceLanguage = "auto") => {
  if (!transcriptText || typeof transcriptText !== "string" || transcriptText.trim() === "") {
    const error = new Error("Cannot translate empty transcript text.");
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  if (!targetLanguage || typeof targetLanguage !== "string" || targetLanguage.trim() === "") {
    const error = new Error("Target language is required and cannot be empty.");
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  const normalizedTarget = resolveLanguageName(targetLanguage);
  const normalizedSource = sourceLanguage && sourceLanguage !== "auto" ? resolveLanguageName(sourceLanguage) : "auto";

  // Quota Guard: Check if quota cooldown is active
  const quota = getQuotaStatus();
  if (quota.isCooldownActive) {
    const quotaError = new Error(quota.message);
    quotaError.statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
    quotaError.retryAfter = quota.retryAfter;
    quotaError.retryAt = quota.retryAt;
    quotaError.isQuotaExceeded = true;
    throw quotaError;
  }

  // Fast-path for test environment
  if (process.env.NODE_ENV === "test" && !forcePassthroughInTest) {
    if (mockAIResponse?.translatedText) {
      return {
        translatedText: mockAIResponse.translatedText,
        targetLanguage: normalizedTarget,
        sourceLanguage: normalizedSource,
      };
    }
    return {
      translatedText: `[${normalizedTarget} Translation] ${transcriptText.trim()}`,
      targetLanguage: normalizedTarget,
      sourceLanguage: normalizedSource,
    };
  }

  const sourceInstruction =
    normalizedSource && normalizedSource !== "auto"
      ? `from ${normalizedSource} `
      : `(auto-detecting the source language) `;

  const prompt = `You are a professional, high-fidelity language translator specializing in speech transcriptions.
Translate the following speech transcript ${sourceInstruction}into ${normalizedTarget}.

TRANSLATION RULES:
1. Translate the complete transcript faithfully from start to finish without summarizing, omitting, or shortening.
2. Preserve the exact original meaning, tone, nuances, and conversational context.
3. Maintain the exact paragraph breaks, bullet points, and formatting structure of the original transcript.
4. If speaker labels exist (such as "Speaker 1:", "[Speaker A]:", "Host:"), preserve the speaker labels and format exactly, translating only the spoken dialogue.
5. Do NOT include any explanations, translator notes, introductory phrases, or markdown code fences (like \`\`\` or \`\`\`text).
6. Return ONLY the translated transcript text and nothing else.

Transcript to translate:
"""
${transcriptText}
"""`;

  const rawOutput = await callGemini(prompt, {
    temperature: 0.1,
    maxOutputTokens: 4000,
  });

  // Strip potential code block wrappers or extraneous quotes
  let cleaned = rawOutput.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
  }

  return {
    translatedText: cleaned,
    targetLanguage: normalizedTarget,
    sourceLanguage: normalizedSource,
  };
};

