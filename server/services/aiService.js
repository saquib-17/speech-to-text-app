import { GoogleGenAI } from "@google/genai";
import env from "../config/env.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * SpeechScribe AI v2 — AI Intelligence Service (Gemini 3.8 Flash Interactions API)
 *
 * Strict ₹0 Budget Mandate:
 * - Powered by Google Gemini 3.8 Flash free tier (20 requests/day per project limit).
 * - Strictly optional: If GEMINI_API_KEY is not configured, endpoints return
 *   a graceful error and the core transcription engine remains 100% operational.
 * - Test mode (NODE_ENV=test) returns deterministic mock insights instantly or accepts test overrides.
 * - Advanced 429 quota handling: detects quota limits, extracts Google retry times,
 *   activates in-memory cooldown to prevent repeated/redundant calls, and avoids auto-retries.
 */

// Cached GoogleGenAI client instance
let genAIClient = null;

// In-memory mock response for tests
let mockAIResponse = null;

// In-memory Quota Cooldown tracking
let quotaCooldownUntil = null; // Timestamp (ms)
let quotaStatusCache = null;

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
 * Parses upstream Google GenAI errors to detect 429 quota exhaustion
 * and extract retry delay/timestamp when provided by Google.
 *
 * @param {any} err
 * @returns {{ isQuota: boolean, retryAfterSeconds: number, retryAt: string, friendlyMessage: string } | null}
 */
export const extractQuotaErrorDetails = (err) => {
  if (!err) return null;

  const status = err.status || err.statusCode || err.code || err.response?.status;
  const message = `${err.message || ""} ${err.error?.message || ""}`;

  const is429 = status === 429 || status === "429";
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

  let retrySeconds = retryInfoDelaySeconds;

  // 1. Inspect Retry-After header
  if (!retrySeconds) {
    const rawHeader =
      err.headers?.get?.("retry-after") ||
      err.headers?.["retry-after"] ||
      err.response?.headers?.["retry-after"];
    if (rawHeader) {
      const parsedNum = parseInt(rawHeader, 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        retrySeconds = parsedNum;
      } else {
        const parsedDate = Date.parse(rawHeader);
        if (!isNaN(parsedDate) && parsedDate > Date.now()) {
          retrySeconds = Math.ceil((parsedDate - Date.now()) / 1000);
        }
      }
    }
  }

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
 * Call Google Gemini 3.8 Flash via Google GenAI Interactions API.
 *
 * @param {string} prompt - Prompt instruction and context
 * @param {Object} [options] - Generation options
 * @param {number} [options.temperature=0.3] - Sampling temperature
 * @param {number} [options.maxOutputTokens=1500] - Max output token limit
 * @param {number} [options.timeoutMs=30000] - Per-call timeout limit in milliseconds
 * @returns {Promise<string>} Model text output from interaction.output_text
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

  const model = process.env.GEMINI_MODEL || env.GEMINI_MODEL || "gemini-3.8-flash";
  const ai = getGenAIClient();
  const timeoutMs = options.timeoutMs ?? 30000;

  try {
    const interaction = await ai.interactions.create(
      {
        model,
        input: prompt,
        generation_config: {
          temperature: options.temperature ?? 0.3,
          max_output_tokens: options.maxOutputTokens ?? 1500,
        },
      },
      { timeout: timeoutMs }
    );

    const outputText = interaction?.output_text;

    if (!outputText || typeof outputText !== "string" || outputText.trim() === "") {
      const error = new Error("No response generated by Gemini 3.8 Flash model.");
      error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      throw error;
    }

    return outputText.trim();
  } catch (err) {
    if (err.statusCode && err.isQuotaExceeded) {
      throw err;
    }

    // 2. Detect HTTP 429 and Quota-Exceeded Responses
    const quotaDetails = extractQuotaErrorDetails(err);
    if (quotaDetails) {
      setQuotaCooldown(quotaDetails.retryAfterSeconds, quotaDetails.friendlyMessage);
      const quotaErr = new Error(quotaDetails.friendlyMessage);
      quotaErr.statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
      quotaErr.retryAfter = quotaDetails.retryAfterSeconds;
      quotaErr.retryAt = quotaDetails.retryAt;
      quotaErr.isQuotaExceeded = true;
      throw quotaErr;
    }

    // Handle abort / timeout errors
    if (err.name === "AbortError" || err.message?.includes("timed out") || err.code === "ETIMEDOUT") {
      const timeoutErr = new Error("AI generation timed out (30s limit exceeded).");
      timeoutErr.statusCode = 504;
      throw timeoutErr;
    }

    // Handle authentication / invalid key errors (HTTP 400/401 with API_KEY_INVALID)
    if (
      err.status === 401 ||
      err.status === 403 ||
      err.message?.includes("API_KEY_INVALID") ||
      err.message?.includes("API key not valid")
    ) {
      const authErr = new Error("Invalid Gemini API key. Please verify your GEMINI_API_KEY environment variable.");
      authErr.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw authErr;
    }

    // Handle high-demand service unavailability (HTTP 503)
    if (
      err.status === 503 ||
      err.message?.includes("503") ||
      err.message?.includes("high demand") ||
      err.message?.includes("service_unavailable")
    ) {
      const unavailableErr = new Error(
        "Gemini 3.8 Flash is currently experiencing high demand. Please try again later."
      );
      unavailableErr.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw unavailableErr;
    }

    // Handle model deprecation or model not found
    if (err.status === 404 || err.message?.includes("not found") || err.message?.includes("no longer available")) {
      const modelErr = new Error(`Gemini model '${model}' is unavailable or deprecated: ${err.message}`);
      modelErr.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw modelErr;
    }

    // General fallback
    const genericErr = new Error(`AI generation failed: ${err.message || "Unknown error"}`);
    genericErr.statusCode = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    throw genericErr;
  }
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
  if (process.env.NODE_ENV === "test") {
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
  if (process.env.NODE_ENV === "test") {
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
