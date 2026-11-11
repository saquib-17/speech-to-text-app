import express from "express";
import {
  summarizeTranscript,
  askTranscriptQuestion,
  getAIQuotaStatus,
} from "../controllers/aiController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { verifyTranscriptOwnership } from "../middleware/ownershipMiddleware.js";
import { apiLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Enforce JWT authentication and rate limiting across all AI endpoints
router.use(authenticateToken);
router.use(apiLimiter);

/**
 * @route GET /api/ai/quota
 * @desc Get current AI quota cooldown status
 * @access Private
 */
router.get("/quota", getAIQuotaStatus);

/**
 * @route POST /api/ai/summarize/:id
 * @desc Generate executive summary, key points, and action items
 * @access Private (Owner only)
 */
router.post("/summarize/:id", verifyTranscriptOwnership, summarizeTranscript);

/**
 * @route POST /api/ai/ask/:id
 * @desc Ask contextual questions strictly grounded in the transcript
 * @access Private (Owner only)
 */
router.post("/ask/:id", verifyTranscriptOwnership, askTranscriptQuestion);

export default router;

