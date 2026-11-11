import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../server.js";
import { setupTestDB, clearTestDB, teardownTestDB } from "./setup.js";
import Transcript from "../models/transcriptionModel.js";
import {
  resetMockAIResponse,
  setMockAIResponse,
  callGemini,
  setGenAIClient,
  getGenAIClient,
  isAIConfigured,
  setQuotaCooldown,
  resetQuotaCooldown,
  getQuotaStatus,
  extractQuotaErrorDetails,
} from "../services/aiService.js";
import env from "../config/env.js";

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  resetMockAIResponse();
  resetQuotaCooldown();
  setGenAIClient(null);
});

describe("AI Intelligence Engine (/api/ai)", () => {
  let userAToken;
  let userBToken;
  let userATranscript;

  beforeEach(async () => {
    resetQuotaCooldown();
    // Register User A
    const regARes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "User Alpha",
        email: "useralpha@example.com",
        password: "Password123!",
      });
    userAToken = regARes.body.data.token;
    const userAId = regARes.body.data.user._id;

    // Register User B
    const regBRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "User Beta",
        email: "userbeta@example.com",
        password: "Password123!",
      });
    userBToken = regBRes.body.data.token;

    // Create a transcript owned by User A
    userATranscript = await Transcript.create({
      user: userAId,
      title: "Quarterly Strategy Meeting",
      transcriptionText:
        "In this meeting we reviewed Q3 deliverables, addressed the local speech recognition engine migration, and agreed to finish Phase 05 tests before deployment.",
      originalText:
        "In this meeting we reviewed Q3 deliverables, addressed the local speech recognition engine migration, and agreed to finish Phase 05 tests before deployment.",
      status: "completed",
      audioMetadata: {
        originalName: "strategy_q3.wav",
        mimeType: "audio/wav",
        sizeBytes: 2048,
        durationSeconds: 120,
      },
    });
  });

  // 1. Generate Summary
  it("1. should successfully generate AI summary and persist to transcript aiInsights", async () => {
    const res = await request(app)
      .post(`/api/ai/summarize/${userATranscript._id}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("summary generated");
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.keyPoints.length).toBeGreaterThan(0);
    expect(res.body.data.actionItems.length).toBeGreaterThan(0);
    expect(res.body.data.generatedAt).toBeDefined();

    // Verify database update
    const updated = await Transcript.findById(userATranscript._id);
    expect(updated.aiInsights.summary).toBe(res.body.data.summary);
  });

  // 2. Contextual Q&A
  it("2. should answer contextual question grounded in the transcript", async () => {
    const res = await request(app)
      .post(`/api/ai/ask/${userATranscript._id}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ question: "What deliverables were discussed?" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.question).toBe("What deliverables were discussed?");
    expect(res.body.data.answer).toBeDefined();
    expect(res.body.data.transcriptId).toBe(userATranscript._id.toString());
  });

  // 3. Ownership protection on AI summarize (BOLA check)
  it("3. should forbid User B from generating AI summary on User A's transcript (403 Forbidden)", async () => {
    const res = await request(app)
      .post(`/api/ai/summarize/${userATranscript._id}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Access denied. You do not own this transcript.");
  });

  // 4. Ownership protection on AI Q&A (BOLA check)
  it("4. should forbid User B from asking questions on User A's transcript (403 Forbidden)", async () => {
    const res = await request(app)
      .post(`/api/ai/ask/${userATranscript._id}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ question: "What were the secret topics?" });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 5. Validation: Missing question
  it("5. should return 400 Bad Request when question payload is missing or empty", async () => {
    const res = await request(app)
      .post(`/api/ai/ask/${userATranscript._id}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("'question' is required");
  });

  // 6. Validation: Non-existent transcript (404)
  it("6. should return 404 Not Found for non-existent transcript ID", async () => {
    const nonExistentId = "507f1f77bcf86cd799439011";

    const res = await request(app)
      .post(`/api/ai/summarize/${nonExistentId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // 7. Validation: Malformed ObjectId (400)
  it("7. should return 400 Bad Request for malformed transcript ID", async () => {
    const res = await request(app)
      .post("/api/ai/summarize/invalid-hex-id-999")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("malformed");
  });
});

describe("Gemini 3.8 Flash Interactions API Unit Tests", () => {
  beforeEach(() => {
    setGenAIClient(null);
    resetQuotaCooldown();
  });

  it("should verify GEMINI_MODEL defaults to gemini-3.8-flash in configuration", () => {
    expect(env.GEMINI_MODEL).toBe("gemini-3.8-flash");
  });

  it("should successfully call Interactions API and extract output_text cleanly", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: "interaction_12345",
      model: "gemini-3.8-flash",
      output_text: "This is a high quality response from Gemini 3.8 Flash.",
    });

    setGenAIClient({
      interactions: {
        create: mockCreate,
      },
    });

    const result = await callGemini("Summarize this text", {
      temperature: 0.2,
      maxOutputTokens: 1000,
    });

    expect(result).toBe("This is a high quality response from Gemini 3.8 Flash.");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.8-flash",
        input: "Summarize this text",
        generation_config: {
          temperature: 0.2,
          max_output_tokens: 1000,
        },
      }),
      expect.objectContaining({
        timeout: 30000,
      })
    );
  });

  it("should respect GEMINI_MODEL environment variable override", async () => {
    const origModel = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = "gemini-3.8-flash-custom";

    const mockCreate = vi.fn().mockResolvedValue({
      id: "interaction_override",
      output_text: "Custom model output",
    });

    setGenAIClient({
      interactions: {
        create: mockCreate,
      },
    });

    const result = await callGemini("Test prompt");
    expect(result).toBe("Custom model output");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.8-flash-custom",
      }),
      expect.anything()
    );

    // Restore
    if (origModel) {
      process.env.GEMINI_MODEL = origModel;
    } else {
      delete process.env.GEMINI_MODEL;
    }
  });

  it("should throw 429 when rate limit / quota is exceeded", async () => {
    const rateLimitError = new Error("Resource has been exhausted (e.g. check quota).");
    rateLimitError.status = 429;

    setGenAIClient({
      interactions: {
        create: vi.fn().mockRejectedValue(rateLimitError),
      },
    });

    await expect(callGemini("Prompt")).rejects.toMatchObject({
      statusCode: 429,
      isQuotaExceeded: true,
      message: expect.stringContaining("quota"),
    });

    // Reset cooldown so test cleanup is clean
    resetQuotaCooldown();
  });

  it("should throw 503 when Gemini service experiences high demand", async () => {
    resetQuotaCooldown();
    const serviceError = new Error("gemini-3.8-flash is currently experiencing high demand. Please try again later.");
    serviceError.status = 503;

    setGenAIClient({
      interactions: {
        create: vi.fn().mockRejectedValue(serviceError),
      },
    });

    await expect(callGemini("Prompt")).rejects.toMatchObject({
      statusCode: 503,
      message: expect.stringContaining("high demand"),
    });
  });

  it("should throw 401 when API key is invalid", async () => {
    resetQuotaCooldown();
    const authError = new Error("API_KEY_INVALID: API key not valid. Please pass a valid API key.");
    authError.status = 400;

    setGenAIClient({
      interactions: {
        create: vi.fn().mockRejectedValue(authError),
      },
    });

    await expect(callGemini("Prompt")).rejects.toMatchObject({
      statusCode: 401,
      message: expect.stringContaining("Invalid Gemini API key"),
    });
  });

  it("should throw 400 when model is deprecated or not found", async () => {
    resetQuotaCooldown();
    const deprecationError = new Error(
      "This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash."
    );
    deprecationError.status = 404;

    setGenAIClient({
      interactions: {
        create: vi.fn().mockRejectedValue(deprecationError),
      },
    });

    await expect(callGemini("Prompt")).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("unavailable or deprecated"),
    });
  });

  it("should throw 500 when model response has empty output_text", async () => {
    resetQuotaCooldown();
    setGenAIClient({
      interactions: {
        create: vi.fn().mockResolvedValue({
          output_text: "   ",
        }),
      },
    });

    await expect(callGemini("Prompt")).rejects.toMatchObject({
      statusCode: 500,
      message: expect.stringContaining("No response generated"),
    });
  });

  it("should throw 503 when GEMINI_API_KEY is not configured", () => {
    resetQuotaCooldown();
    const origKey = process.env.GEMINI_API_KEY;
    const origEnvKey = env.GEMINI_API_KEY;

    delete process.env.GEMINI_API_KEY;
    env.GEMINI_API_KEY = null;
    setGenAIClient(null);

    expect(() => getGenAIClient()).toThrowError(
      expect.objectContaining({
        statusCode: 503,
        message: expect.stringContaining("Gemini AI features are not configured"),
      })
    );

    // Restore
    process.env.GEMINI_API_KEY = origKey;
    env.GEMINI_API_KEY = origEnvKey;
  });
});

describe("Gemini Quota & Rate Limit Cooldown Handling", () => {
  let userToken;
  let userTranscript;

  beforeEach(async () => {
    resetQuotaCooldown();
    setGenAIClient(null);

    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Quota Test User",
        email: "quota_user@example.com",
        password: "Password123!",
      });
    userToken = regRes.body.data.token;
    const userId = regRes.body.data.user._id;

    userTranscript = await Transcript.create({
      user: userId,
      title: "Quota Test Recording",
      transcriptionText: "Today we discussed quota management and retry handling.",
      originalText: "Today we discussed quota management and retry handling.",
      status: "completed",
      audioMetadata: {
        originalName: "quota_meeting.wav",
        mimeType: "audio/wav",
        sizeBytes: 1024,
        durationSeconds: 60,
      },
    });
  });

  // 1. Quota status endpoint returns available when no cooldown active
  it("should report quota as available via GET /api/ai/quota when no cooldown is active", async () => {
    const res = await request(app)
      .get("/api/ai/quota")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isCooldownActive).toBe(false);
    expect(res.body.data.retryAfter).toBeNull();
  });

  // 2. Quota status endpoint returns active cooldown
  it("should report active cooldown and retry time via GET /api/ai/quota", async () => {
    setQuotaCooldown(3600, "Daily Gemini AI limit reached (20 requests/day).");

    const res = await request(app)
      .get("/api/ai/quota")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isCooldownActive).toBe(true);
    expect(res.body.data.retryAfter).toBeGreaterThan(0);
    expect(res.body.data.retryAt).toBeDefined();
    expect(res.body.data.message).toContain("Daily Gemini AI limit reached");
  });

  // 3. Extract retry seconds from Google google.rpc.RetryInfo
  it("should extract retry seconds from google.rpc.RetryInfo detail", () => {
    const errorWithRetryInfo = {
      status: 429,
      message: "Resource has been exhausted (e.g. check quota).",
      details: [
        {
          "@type": "type.googleapis.com/google.rpc.RetryInfo",
          retryDelay: "3600s",
        },
      ],
    };

    const extracted = extractQuotaErrorDetails(errorWithRetryInfo);
    expect(extracted).not.toBeNull();
    expect(extracted.isQuota).toBe(true);
    expect(extracted.retryAfterSeconds).toBe(3600);
    expect(extracted.retryAt).toBeDefined();
    expect(extracted.friendlyMessage).toContain("Daily Gemini AI request limit reached");
  });

  // 4. Extract retry seconds from message text formats
  it("should extract retry seconds from message text (retry after 45s / 1h 30m)", () => {
    const errorSeconds = {
      status: 429,
      message: "Resource has been exhausted (e.g. check quota). Please retry after 45s.",
    };
    const extractedSeconds = extractQuotaErrorDetails(errorSeconds);
    expect(extractedSeconds.retryAfterSeconds).toBe(45);

    const errorHoursMin = {
      status: 429,
      message: "Quota exceeded for project. Please retry after 1h 30m.",
    };
    const extractedHours = extractQuotaErrorDetails(errorHoursMin);
    expect(extractedHours.retryAfterSeconds).toBe(5400); // 1h (3600) + 30m (1800)
  });

  // 5. Extract retry seconds from Retry-After header
  it("should extract retry delay from Retry-After header", () => {
    const errorHeader = {
      status: 429,
      message: "Too Many Requests",
      headers: {
        get: (header) => (header.toLowerCase() === "retry-after" ? "120" : null),
      },
    };
    const extracted = extractQuotaErrorDetails(errorHeader);
    expect(extracted.retryAfterSeconds).toBe(120);
  });

  // 6. Detect daily quota limit format (20 requests per day)
  it("should detect daily quota limit and return a friendly daily quota message", () => {
    const dailyQuotaError = {
      status: 429,
      message:
        "Quota exceeded for quota metric 'GenerateContent requests per project per day' and limit '20' of service 'generativelanguage.googleapis.com'.",
    };
    const extracted = extractQuotaErrorDetails(dailyQuotaError);
    expect(extracted.isQuota).toBe(true);
    expect(extracted.friendlyMessage).toContain("Daily Gemini AI request limit reached (20 requests/day free tier)");
    expect(extracted.retryAfterSeconds).toBeGreaterThan(0);
  });

  // 7. Blocks repeated calls when cooldown is active without calling upstream Gemini
  it("should immediately reject repeated callGemini calls while cooldown is active", async () => {
    const mockCreate = vi.fn();
    setGenAIClient({
      interactions: {
        create: mockCreate,
      },
    });

    // Set cooldown active
    setQuotaCooldown(120, "Daily quota limit reached.");

    await expect(callGemini("Any prompt")).rejects.toMatchObject({
      statusCode: 429,
      isQuotaExceeded: true,
      retryAfter: expect.any(Number),
      message: expect.stringContaining("Daily quota limit reached"),
    });

    // Upstream Google API was NEVER called
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // 8. Summarize and Ask endpoints return 429 with Retry-After header during active cooldown
  it("should reject POST /api/ai/summarize/:id with 429 and Retry-After header during cooldown", async () => {
    setQuotaCooldown(300, "Daily Gemini AI request limit reached.");

    const res = await request(app)
      .post(`/api/ai/summarize/${userTranscript._id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.isQuotaExceeded).toBe(true);
    expect(res.body.retryAfter).toBeGreaterThan(0);
    expect(res.body.retryAt).toBeDefined();
    expect(res.header["retry-after"]).toBeDefined();
    expect(res.body.message).toContain("Daily Gemini AI request limit reached");
  });

  it("should reject POST /api/ai/ask/:id with 429 and Retry-After header during cooldown", async () => {
    setQuotaCooldown(300, "Daily Gemini AI request limit reached.");

    const res = await request(app)
      .post(`/api/ai/ask/${userTranscript._id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ question: "What is this recording about?" });

    expect(res.statusCode).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.isQuotaExceeded).toBe(true);
    expect(res.body.retryAfter).toBeGreaterThan(0);
    expect(res.body.retryAt).toBeDefined();
    expect(res.header["retry-after"]).toBeDefined();
  });

  // 9. Resetting cooldown immediately allows requests to proceed
  it("should allow AI requests to proceed immediately after cooldown is reset or expired", async () => {
    setQuotaCooldown(300);
    expect(getQuotaStatus().isCooldownActive).toBe(true);

    // Reset cooldown
    resetQuotaCooldown();
    expect(getQuotaStatus().isCooldownActive).toBe(false);

    const res = await request(app)
      .post(`/api/ai/summarize/${userTranscript._id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
