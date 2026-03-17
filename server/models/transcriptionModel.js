import mongoose from "mongoose";

const transcriptionSchema = new mongoose.Schema(
  {
    audioFile: {
      type: String,
      required: true,
    },
    transcriptionText: {
      type: String,
      default: "",
    },
    userId: {
      type: String,
      index: true, // speeds up per-user history queries
    },
  },
  { timestamps: true } // auto-adds createdAt + updatedAt
);

const Transcription = mongoose.model("Transcription", transcriptionSchema);

export default Transcription;