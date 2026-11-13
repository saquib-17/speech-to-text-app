import { generateSummary, answerQuestion, translateTranscript, getQuotaStatus } from "../services/aiService.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

// In-memory active in-flight request tracker to deduplicate concurrent requests
const inFlightRequests = new Map();

/**
 * Resets active in-flight requests (primarily for unit tests)
 */
export const resetInFlightRequests = () => {
  inFlightRequests.clear();
};

/**
 * Returns number of current in-flight operations
 * @returns {number}
 */
export const getActiveInFlightCount = () => {
  return inFlightRequests.size;
};

/**
 * Controller: Generate AI summary, key points, and action items for a transcript
 * @route POST /api/ai/summarize/:id
 * @access Private (Bearer JWT + Ownership Verified)
 */
export const summarizeTranscript = async (req, res, next) => {
  try {
    const transcript = req.transcript;
    const transcriptId = transcript._id.toString();
    const opKey = `summarize:${transcriptId}`;

    if (!transcript.transcriptionText || transcript.transcriptionText.trim() === "") {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Cannot generate summary: Transcript has no text content.",
      });
    }

    if (inFlightRequests.has(opKey)) {
      console.warn(`[AI Controller] Concurrent summarize request detected for transcript ${transcriptId}. Awaiting in-flight operation.`);
      const insights = await inFlightRequests.get(opKey);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Transcript summary generated successfully.",
        data: insights,
      });
    }

    const opPromise = (async () => {
      const insights = await generateSummary(transcript.transcriptionText);

      // Persist insights to the transcript document
      transcript.aiInsights = {
        summary: insights.summary,
        keyPoints: insights.keyPoints,
        actionItems: insights.actionItems,
        generatedAt: new Date(),
      };

      await transcript.save();
      return transcript.aiInsights;
    })();

    inFlightRequests.set(opKey, opPromise);

    try {
      const insights = await opPromise;
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Transcript summary generated successfully.",
        data: insights,
      });
    } finally {
      inFlightRequests.delete(opKey);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Contextual Q&A grounded strictly in the transcript
 * @route POST /api/ai/ask/:id
 * @access Private (Bearer JWT + Ownership Verified)
 */
export const askTranscriptQuestion = async (req, res, next) => {
  try {
    const transcript = req.transcript;
    const transcriptId = transcript._id.toString();
    const { question } = req.body;

    if (!question || typeof question !== "string" || question.trim() === "") {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Payload Missing: 'question' is required and cannot be empty.",
      });
    }

    const normalizedQuestion = question.trim().toLowerCase();
    const opKey = `ask:${transcriptId}:${normalizedQuestion}`;

    if (inFlightRequests.has(opKey)) {
      console.warn(`[AI Controller] Concurrent ask question request detected for transcript ${transcriptId}. Awaiting in-flight operation.`);
      const result = await inFlightRequests.get(opKey);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Question answered successfully.",
        data: result,
      });
    }

    const opPromise = (async () => {
      const result = await answerQuestion(transcript.transcriptionText, question);
      return {
        transcriptId: transcript._id,
        question: result.question,
        answer: result.answer,
      };
    })();

    inFlightRequests.set(opKey, opPromise);

    try {
      const result = await opPromise;
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Question answered successfully.",
        data: result,
      });
    } finally {
      inFlightRequests.delete(opKey);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Translate transcript into specified target language
 * @route POST /api/ai/translate/:id
 * @access Private (Bearer JWT + Ownership Verified)
 */
export const translateTranscriptHandler = async (req, res, next) => {
  try {
    const transcript = req.transcript;
    const transcriptId = transcript._id.toString();
    const { targetLanguage, sourceLanguage = "auto" } = req.body;

    if (!transcript.transcriptionText || transcript.transcriptionText.trim() === "") {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Cannot translate: Transcript has no text content.",
      });
    }

    if (!targetLanguage || typeof targetLanguage !== "string" || targetLanguage.trim() === "") {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Payload Missing: 'targetLanguage' is required and cannot be empty.",
      });
    }

    const normalizedTarget = targetLanguage.trim().toLowerCase();
    const opKey = `translate:${transcriptId}:${normalizedTarget}`;

    if (inFlightRequests.has(opKey)) {
      console.warn(
        `[AI Controller] Concurrent translation request detected for transcript ${transcriptId} -> ${targetLanguage}. Awaiting in-flight operation.`
      );
      const result = await inFlightRequests.get(opKey);
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Transcript translated successfully.",
        data: result,
      });
    }

    const opPromise = (async () => {
      const result = await translateTranscript(
        transcript.transcriptionText,
        targetLanguage,
        sourceLanguage
      );
      return {
        transcriptId: transcript._id,
        title: transcript.title,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        originalText: transcript.transcriptionText,
        translatedText: result.translatedText,
      };
    })();

    inFlightRequests.set(opKey, opPromise);

    try {
      const result = await opPromise;
      return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Transcript translated successfully.",
        data: result,
      });
    } finally {
      inFlightRequests.delete(opKey);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get current AI quota cooldown status
 * @route GET /api/ai/quota
 * @access Private (Bearer JWT)
 */
export const getAIQuotaStatus = async (req, res, next) => {
  try {
    const status = getQuotaStatus();
    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: status.isCooldownActive
        ? "Daily Gemini AI quota limit is active."
        : "Gemini AI quota is currently available.",
      data: status,
    });
  } catch (error) {
    next(error);
  }
};


