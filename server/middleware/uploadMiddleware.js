import multer from "multer";
import { ALLOWED_AUDIO_MIMES, MAX_AUDIO_FILE_SIZE } from "../config/constants.js";

// In-Memory Storage: Eliminates disk I/O bottlenecks and temporary file accumulation
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_AUDIO_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Invalid audio file format. Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM.");
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_AUDIO_FILE_SIZE,
  },
});

export default upload;
