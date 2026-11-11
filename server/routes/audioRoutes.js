import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { uploadAudio, submitRecording, transcribeAudio } from "../controllers/audioController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { apiLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Enforce JWT authentication and rate limiting across all audio ingestion endpoints
router.use(authenticateToken);
router.use(apiLimiter);

router.post("/upload", upload.single("audio"), uploadAudio);
router.post("/recording", upload.single("audio"), submitRecording);
router.post("/transcribe", upload.single("audio"), transcribeAudio);

export default router;

