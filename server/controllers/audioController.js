import { processAudioIngestion, releaseAudioBuffer } from "../services/audioService.js";
import { getSpeechProvider } from "../services/speech/index.js";
import { createTranscript } from "../services/transcriptService.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * Controller: Handle uploaded audio files
 * Ingests audio, transcribes via Faster-Whisper, persists to DB, and frees RAM.
 * @route POST /api/audio/upload
 * @access Private (Bearer JWT)
 */
export const uploadAudio = async (req, res, next) => {
  let descriptor = null;
  try {
    if (!req.file) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Payload Missing: No audio file detected in the request under field 'audio'.",
      });
    }

    const userId = req.user._id || req.user.id;
    descriptor = processAudioIngestion(req.file, {
      source: "upload",
      customTitle: req.body.title,
      userId,
    });

    // Execute speech-to-text transcription
    const speechProvider = getSpeechProvider();
    const transcriptionResult = await speechProvider.transcribe(
      descriptor.buffer,
      descriptor.mimeType,
      { language: req.body.language }
    );

    const safeText = transcriptionResult.text || "[No audible speech detected]";

    // Persist transcript to MongoDB
    const transcriptDoc = await createTranscript({
      user: userId,
      title: descriptor.title,
      transcriptionText: safeText,
      originalText: safeText,
      status: "completed",
      audioMetadata: {
        originalName: descriptor.originalName,
        mimeType: descriptor.mimeType,
        sizeBytes: descriptor.sizeBytes,
        durationSeconds: transcriptionResult.durationSeconds || 0,
        storageUrl: null,
      },
      transcriptionMetadata: {
        provider: transcriptionResult.provider || "faster-whisper",
        model: transcriptionResult.model || "base",
        language: transcriptionResult.language || "en",
        languageProbability: transcriptionResult.languageProbability || 0,
        durationSeconds: transcriptionResult.durationSeconds || 0,
        confidence: transcriptionResult.confidence || 0,
        words: transcriptionResult.words || [],
      },
    });

    const responseData = {
      audioId: descriptor.audioId,
      title: descriptor.title,
      originalName: descriptor.originalName,
      mimeType: descriptor.mimeType,
      format: descriptor.format,
      sizeBytes: descriptor.sizeBytes,
      source: descriptor.source,
      status: descriptor.status,
      createdAt: descriptor.createdAt,
      transcriptId: transcriptDoc._id,
      transcriptionText: transcriptDoc.transcriptionText,
      transcript: transcriptDoc,
    };

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Audio file uploaded and verified successfully.",
      data: responseData,
    });
  } catch (error) {
    next(error);
  } finally {
    if (descriptor) {
      releaseAudioBuffer(descriptor);
    }
  }
};

/**
 * Controller: Handle in-browser microphone recordings
 * Ingests audio blob, transcribes via Faster-Whisper, persists to DB, and frees RAM.
 * @route POST /api/audio/recording
 * @access Private (Bearer JWT)
 */
export const submitRecording = async (req, res, next) => {
  let descriptor = null;
  try {
    if (!req.file) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Payload Missing: No recording audio blob detected under field 'audio'.",
      });
    }

    const userId = req.user._id || req.user.id;
    descriptor = processAudioIngestion(req.file, {
      source: "recording",
      customTitle: req.body.title,
      userId,
    });

    // Execute speech-to-text transcription
    const speechProvider = getSpeechProvider();
    const transcriptionResult = await speechProvider.transcribe(
      descriptor.buffer,
      descriptor.mimeType,
      { language: req.body.language }
    );

    const safeText = transcriptionResult.text || "[No audible speech detected]";

    // Persist transcript to MongoDB
    const transcriptDoc = await createTranscript({
      user: userId,
      title: descriptor.title,
      transcriptionText: safeText,
      originalText: safeText,
      status: "completed",
      audioMetadata: {
        originalName: descriptor.originalName,
        mimeType: descriptor.mimeType,
        sizeBytes: descriptor.sizeBytes,
        durationSeconds: transcriptionResult.durationSeconds || 0,
        storageUrl: null,
      },
      transcriptionMetadata: {
        provider: transcriptionResult.provider || "faster-whisper",
        model: transcriptionResult.model || "base",
        language: transcriptionResult.language || "en",
        languageProbability: transcriptionResult.languageProbability || 0,
        durationSeconds: transcriptionResult.durationSeconds || 0,
        confidence: transcriptionResult.confidence || 0,
        words: transcriptionResult.words || [],
      },
    });

    const responseData = {
      audioId: descriptor.audioId,
      title: descriptor.title,
      originalName: descriptor.originalName,
      mimeType: descriptor.mimeType,
      format: descriptor.format,
      sizeBytes: descriptor.sizeBytes,
      source: descriptor.source,
      status: descriptor.status,
      createdAt: descriptor.createdAt,
      transcriptId: transcriptDoc._id,
      transcriptionText: transcriptDoc.transcriptionText,
      transcript: transcriptDoc,
    };

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Audio recording submitted and verified successfully.",
      data: responseData,
    });
  } catch (error) {
    next(error);
  } finally {
    if (descriptor) {
      releaseAudioBuffer(descriptor);
    }
  }
};

/**
 * Controller: Direct audio transcription endpoint
 * Ingests audio, transcribes, and directly returns the complete Transcript entity.
 * @route POST /api/audio/transcribe
 * @access Private (Bearer JWT)
 */
export const transcribeAudio = async (req, res, next) => {
  let descriptor = null;
  try {
    if (!req.file) {
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        error: "Bad Request",
        message: "Payload Missing: No audio file detected in the request under field 'audio'.",
      });
    }

    const userId = req.user._id || req.user.id;
    descriptor = processAudioIngestion(req.file, {
      source: req.body.source === "recording" ? "recording" : "upload",
      customTitle: req.body.title,
      userId,
    });

    const speechProvider = getSpeechProvider();
    const transcriptionResult = await speechProvider.transcribe(
      descriptor.buffer,
      descriptor.mimeType,
      { language: req.body.language }
    );

    const safeText = transcriptionResult.text || "[No audible speech detected]";

    const transcriptDoc = await createTranscript({
      user: userId,
      title: descriptor.title,
      transcriptionText: safeText,
      originalText: safeText,
      status: "completed",
      audioMetadata: {
        originalName: descriptor.originalName,
        mimeType: descriptor.mimeType,
        sizeBytes: descriptor.sizeBytes,
        durationSeconds: transcriptionResult.durationSeconds || 0,
        storageUrl: null,
      },
      transcriptionMetadata: {
        provider: transcriptionResult.provider || "faster-whisper",
        model: transcriptionResult.model || "base",
        language: transcriptionResult.language || "en",
        languageProbability: transcriptionResult.languageProbability || 0,
        durationSeconds: transcriptionResult.durationSeconds || 0,
        confidence: transcriptionResult.confidence || 0,
        words: transcriptionResult.words || [],
      },
    });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Audio transcribed successfully.",
      data: transcriptDoc,
    });
  } catch (error) {
    next(error);
  } finally {
    if (descriptor) {
      releaseAudioBuffer(descriptor);
    }
  }
};
