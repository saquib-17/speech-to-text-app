import crypto from "crypto";
import path from "path";
import {
  ALLOWED_AUDIO_MIMES,
  ALLOWED_AUDIO_EXTENSIONS,
  MIME_TO_EXTENSION_MAP,
  MAX_AUDIO_FILE_SIZE,
  HTTP_STATUS,
} from "../config/constants.js";

/**
 * Sanitizes a client-supplied filename to prevent path traversal,
 * control character injection, or excessively long names.
 * @param {string} filename - Raw filename
 * @param {string} defaultPrefix - Fallback prefix
 * @returns {string} - Clean, sanitized filename
 */
export const sanitizeFilename = (filename, defaultPrefix = "audio") => {
  if (!filename || typeof filename !== "string" || filename.trim() === "") {
    return `${defaultPrefix}_${Date.now()}`;
  }

  // Strip path traversal and directory separators
  let base = path.basename(filename).replace(/[\0\x00-\x1f\x7f-\x9f/\\]/g, "");

  // Retain only safe characters (alphanumeric, dots, hyphens, underscores, spaces)
  let clean = base.replace(/[^a-zA-Z0-9._\- ]/g, "_").trim();

  // If filename becomes empty or is hidden (starts with dot), prepend safe prefix
  if (clean.length === 0 || clean.startsWith(".")) {
    clean = `${defaultPrefix}_${Date.now()}${clean}`;
  }

  return clean.slice(0, 100);
};

/**
 * Validates audio file payload integrity, MIME type, extension, and size.
 * @param {object} file - Express/Multer file object
 * @param {object} options - Validation options { source: 'upload' | 'recording' }
 */
export const validateAudioPayload = (file, options = { source: "upload" }) => {
  // 1. Verify file presence
  if (!file) {
    const error = new Error("Payload Missing: No audio file detected in the request.");
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  // 2. Verify non-empty file content
  if (!file.buffer || file.size === 0 || file.buffer.length === 0) {
    const error = new Error("Empty Audio File: The uploaded audio payload contains 0 bytes.");
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  // 3. Verify file size ceiling
  if (file.size > MAX_AUDIO_FILE_SIZE) {
    const error = new Error("Payload Too Large: Audio file exceeds maximum limit of 25 MB.");
    error.statusCode = HTTP_STATUS.PAYLOAD_TOO_LARGE;
    throw error;
  }

  // 4. Verify MIME type against allowed whitelist
  if (!ALLOWED_AUDIO_MIMES.includes(file.mimetype)) {
    const error = new Error(
      `Unsupported Audio Format: '${file.mimetype}'. Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM, MP4.`
    );
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  // 5. Verify file extension if provided
  if (file.originalname && file.originalname.includes(".")) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext && !ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      const error = new Error(
        `Invalid File Extension: '${ext}'. Supported extensions: ${ALLOWED_AUDIO_EXTENSIONS.join(", ")}.`
      );
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
  }

  return true;
};

/**
 * Ingests and normalizes an audio payload into a standardized processing descriptor.
 * Manages memory buffer metadata and prepares audio for downstream transcription providers.
 *
 * @param {object} file - Multer file object
 * @param {object} params - { source: 'upload' | 'recording', customTitle: string, userId: string }
 * @returns {object} - Normalized audio descriptor
 */
export const processAudioIngestion = (file, { source = "upload", customTitle = null, userId }) => {
  // Execute validation pipeline
  validateAudioPayload(file, { source });

  // Infer canonical extension and format
  const format = MIME_TO_EXTENSION_MAP[file.mimetype] || "wav";

  // Generate safe cryptographically random internal audio identifier
  const audioId = "aud_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);

  // Sanitize filename
  let sanitizedName = sanitizeFilename(file.originalname, source);

  // For recording blobs without extension or generic "blob" name, generate descriptive name
  if (!sanitizedName.includes(".") || sanitizedName.startsWith("blob")) {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    sanitizedName = `recording_${timestampStr}.${format}`;
  }

  const title = (customTitle && typeof customTitle === "string" && customTitle.trim().length > 0)
    ? customTitle.trim().slice(0, 120)
    : sanitizedName.replace(/\.[^/.]+$/, ""); // Strip extension for default title

  const audioDescriptor = {
    audioId,
    title,
    originalName: sanitizedName,
    mimeType: file.mimetype,
    format,
    sizeBytes: file.size,
    source, // 'upload' | 'recording'
    status: "ready_for_transcription",
    createdAt: new Date().toISOString(),
    userId,
    // Note: file.buffer is accessible here for Phase 05 transcription providers
    buffer: file.buffer,
  };

  return audioDescriptor;
};

/**
 * Explicit helper to clean up in-memory buffer reference after processing
 * to allow garbage collection and avoid memory retention.
 * @param {object} audioDescriptor
 */
export const releaseAudioBuffer = (audioDescriptor) => {
  if (audioDescriptor && audioDescriptor.buffer) {
    audioDescriptor.buffer = null;
  }
};

