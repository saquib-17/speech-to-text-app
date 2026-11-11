import { generateSummary, answerQuestion, getQuotaStatus } from "../services/aiService.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * Controller: Generate AI summary, key points, and action items for a transcript
 * @route POST /api/ai/summarize/:id
 * @access Private (Bearer JWT + Ownership Verified)
 */
export const summarizeTranscript = async (req, res, next) => {
  try {
    const transcript = req.transcript;

    if (!transcript.transcriptionText || transcript.transcriptionText.trim() === "") {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Cannot generate summary: Transcript has no text content.",
      });
    }

    const insights = await generateSummary(transcript.transcriptionText);

    // Persist insights to the transcript document
    transcript.aiInsights = {
      summary: insights.summary,
      keyPoints: insights.keyPoints,
      actionItems: insights.actionItems,
      generatedAt: new Date(),
    };

    await transcript.save();

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Transcript summary generated successfully.",
      data: transcript.aiInsights,
    });
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
    const { question } = req.body;

    if (!question || typeof question !== "string" || question.trim() === "") {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Payload Missing: 'question' is required and cannot be empty.",
      });
    }

    const result = await answerQuestion(transcript.transcriptionText, question);

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Question answered successfully.",
      data: {
        transcriptId: transcript._id,
        question: result.question,
        answer: result.answer,
      },
    });
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


