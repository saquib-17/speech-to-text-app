import Transcript from "../models/transcriptionModel.js";
import { validateTranscriptUpdate } from "../validators/transcriptValidator.js";

/**
 * Service: Fetch paginated transcripts for authenticated user
 */
export const getUserTranscripts = async (userId, { page = 1, limit = 10, search = null }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Base query: Strictly scoped to authenticated user ID
  const query = { user: userId };

  // Full-text search or title regex fallback
  if (search && typeof search === "string" && search.trim() !== "") {
    const trimmed = search.trim();
    query.$or = [
      { title: { $regex: trimmed, $options: "i" } },
      { transcriptionText: { $regex: trimmed, $options: "i" } },
    ];
  }

  // Projection: Omit heavy `words` array for archive list efficiency
  const [transcripts, totalCount] = await Promise.all([
    Transcript.find(query)
      .select("-transcriptionMetadata.words")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Transcript.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / limitNum) || 1;

  return {
    transcripts,
    meta: {
      currentPage: pageNum,
      limit: limitNum,
      totalCount,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  };
};

/**
 * Service: Fetch single transcript by ID with ownership verification
 */
export const getTranscriptById = async (transcriptId, userId) => {
  const transcript = await Transcript.findOne({
    _id: transcriptId,
    user: userId,
  }).lean();

  if (!transcript) {
    const error = new Error("Transcript not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return transcript;
};

/**
 * Service: Update transcript title or body text
 */
export const updateTranscript = async (transcriptId, userId, updateData) => {
  const { isValid, errors } = validateTranscriptUpdate(updateData);
  if (!isValid) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  const allowedUpdates = {};
  if (updateData.title !== undefined) {
    allowedUpdates.title = updateData.title.trim();
  }
  if (updateData.transcriptionText !== undefined) {
    allowedUpdates.transcriptionText = updateData.transcriptionText.trim();
  }

  const updatedTranscript = await Transcript.findOneAndUpdate(
    { _id: transcriptId, user: userId },
    { $set: allowedUpdates },
    { returnDocument: "after", runValidators: true }
  ).lean();

  if (!updatedTranscript) {
    const error = new Error("Transcript not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return updatedTranscript;
};

/**
 * Service: Delete transcript
 */
export const deleteTranscript = async (transcriptId, userId) => {
  const result = await Transcript.findOneAndDelete({
    _id: transcriptId,
    user: userId,
  });

  if (!result) {
    const error = new Error("Transcript not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return { id: transcriptId };
};

/**
 * Service: Create a new transcript document
 */
export const createTranscript = async (transcriptData) => {
  const transcript = await Transcript.create(transcriptData);
  return transcript;
};
