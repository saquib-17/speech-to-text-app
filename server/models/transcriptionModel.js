import mongoose from "mongoose";

const transcriptionSchema = new mongoose.Schema({
  audioFile: {
    type: String,
    required: true,
  },
  transcriptionText: {
    type: String,
  },
  userId: {
    type: String,
    required: false, // Set to true after front-end auth is solid
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transcription = mongoose.model("Transcription", transcriptionSchema);

export default Transcription;