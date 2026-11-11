import express from "express";
import authRoutes from "./authRoutes.js";
import transcriptRoutes from "./transcriptRoutes.js";
import audioRoutes from "./audioRoutes.js";
import healthRoutes from "./healthRoutes.js";
import aiRoutes from "./aiRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/transcripts", transcriptRoutes);
router.use("/audio", audioRoutes);
router.use("/health", healthRoutes);
router.use("/ai", aiRoutes);

export default router;

