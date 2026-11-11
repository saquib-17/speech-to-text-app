import express from "express";
import {
  getTranscripts,
  getTranscript,
  updateTranscriptHandler,
  deleteTranscriptHandler,
  createTranscriptHandler,
} from "../controllers/transcriptController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { verifyTranscriptOwnership } from "../middleware/ownershipMiddleware.js";
import { apiLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Apply authentication to all transcript routes
router.use(authenticateToken);
router.use(apiLimiter);

router.get("/", getTranscripts);
router.post("/", createTranscriptHandler);
router.get("/:id", verifyTranscriptOwnership, getTranscript);
router.patch("/:id", verifyTranscriptOwnership, updateTranscriptHandler);
router.delete("/:id", verifyTranscriptOwnership, deleteTranscriptHandler);

export default router;

