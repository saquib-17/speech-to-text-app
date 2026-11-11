import {
  getUserTranscripts,
  getTranscriptById,
  updateTranscript,
  deleteTranscript,
  createTranscript,
} from "../services/transcriptService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * Controller: Get paginated transcripts for authenticated user
 * @route GET /api/transcripts
 */
export const getTranscripts = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const userId = req.user._id || req.user.id;

    const { transcripts, meta } = await getUserTranscripts(userId, {
      page,
      limit,
      search,
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Transcripts retrieved successfully.",
      data: transcripts,
      meta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get single transcript by ID
 * @route GET /api/transcripts/:id
 */
export const getTranscript = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const transcript = await getTranscriptById(id, userId);

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Transcript details retrieved successfully.",
      data: transcript,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update transcript
 * @route PATCH /api/transcripts/:id
 */
export const updateTranscriptHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const updated = await updateTranscript(id, userId, req.body);

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Transcript updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete transcript
 * @route DELETE /api/transcripts/:id
 */
export const deleteTranscriptHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const result = await deleteTranscript(id, userId);

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Transcript removed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Create transcript directly (Authenticated)
 * @route POST /api/transcripts
 */
export const createTranscriptHandler = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      title,
      transcriptionText,
      originalText,
      audioMetadata,
      transcriptionMetadata,
      aiInsights,
      status,
    } = req.body;

    if (!transcriptionText) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Transcription text cannot be empty.",
      });
    }

    const transcript = await createTranscript({
      user: userId,
      title: title || "Untitled Recording",
      transcriptionText,
      originalText: originalText || transcriptionText,
      status: status || "completed",
      audioMetadata: audioMetadata || {
        originalName: "recording.wav",
        mimeType: "audio/wav",
        sizeBytes: 0,
        durationSeconds: 0,
      },
      transcriptionMetadata: transcriptionMetadata || {},
      aiInsights: aiInsights || {},
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Transcript created successfully.",
      data: transcript,
    });
  } catch (error) {
    next(error);
  }
};

