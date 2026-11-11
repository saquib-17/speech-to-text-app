import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { uploadAudio, getTranscriptions, deleteTranscription } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/upload", upload.single("audio"), uploadAudio);
router.get("/history", getTranscriptions);
router.delete("/history/:id", deleteTranscription);

export default router;