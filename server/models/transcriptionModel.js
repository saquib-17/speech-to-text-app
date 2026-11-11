import mongoose from "mongoose";

// Sub-schema: Word-level timestamps & speaker diarization
const wordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    confidence: { type: Number, min: 0, max: 1 },
    speaker: { type: Number, default: null },
  },
  { _id: false }
);

// Sub-schema: Audio File Metadata
const audioMetadataSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    durationSeconds: { type: Number, default: 0 },
    storageUrl: { type: String, default: null }, // Optional: Audio retention is not mandatory
  },
  { _id: false }
);

// Sub-schema: Speech-to-Text Metadata
const transcriptionMetadataSchema = new mongoose.Schema(
  {
    provider: { type: String, default: "faster-whisper" },
    model: { type: String, default: "base" },
    language: { type: String, default: "en" },
    languageProbability: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    words: { type: [wordSchema], default: [] },
  },
  { _id: false }
);

// Sub-schema: AI Generated Insights (Optional / On-Demand)
const aiInsightsSchema = new mongoose.Schema(
  {
    summary: { type: String, default: null },
    keyPoints: { type: [String], default: [] },
    actionItems: { type: [String], default: [] },
    generatedAt: { type: Date, default: null },
  },
  { _id: false }
);

// Primary Transcript Schema
const transcriptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Transcript must belong to a user."],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters."],
      default: "Untitled Recording",
    },
    transcriptionText: {
      type: String,
      required: [true, "Transcription text cannot be empty."],
    },
    originalText: {
      type: String,
      required: [true, "Original transcription text is required."],
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "completed",
      index: true,
    },
    audioMetadata: {
      type: audioMetadataSchema,
      required: true,
    },
    transcriptionMetadata: {
      type: transcriptionMetadataSchema,
      default: () => ({}),
    },
    aiInsights: {
      type: aiInsightsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound Index: Speeds up user-specific pagination and chronological sorting
transcriptSchema.index({ user: 1, createdAt: -1 });

// Full-Text Search Index: Enables fast search over titles and transcription body
transcriptSchema.index(
  { title: "text", transcriptionText: "text" },
  { weights: { title: 5, transcriptionText: 1 }, name: "TranscriptTextSearchIndex" }
);

const Transcript = mongoose.model("Transcript", transcriptSchema);
export default Transcript;
