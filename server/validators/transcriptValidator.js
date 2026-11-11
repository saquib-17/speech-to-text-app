/**
 * Validation for transcript updates
 */
export const validateTranscriptUpdate = ({ title, transcriptionText }) => {
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      errors.push("Title cannot be empty.");
    } else if (title.trim().length > 120) {
      errors.push("Title cannot exceed 120 characters.");
    }
  }

  if (transcriptionText !== undefined) {
    if (typeof transcriptionText !== "string" || transcriptionText.trim().length === 0) {
      errors.push("Transcription text cannot be empty.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

