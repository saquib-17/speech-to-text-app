import asyncHandler from "express-async-handler";
import fs from "fs-extra";
import { transcribeAudio } from "../services/deepgramService.js";
import Transcription from "../models/transcriptionModel.js";

// @desc    Upload audio and get transcription
// @route   POST /api/upload
// @access  Public
export const uploadAudio = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Payload Missing: No audio file detected in the request."
        });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;

    try {
        // 1. Transcribe audio
        const transcriptionText = await transcribeAudio(filePath, mimeType);

        // 2. Save to database
        const transcription = await Transcription.create({
            audioFile: fileName,
            transcriptionText,
            userId: req.body.userId || null,
        });

        // 3. Return response
        res.status(201).json({
            success: true,
            message: "Transcription node established successfully.",
            data: transcription,
        });
    } catch (error) {
        console.error("Transcription Controller Error:", error);

        // Handle specific Deepgram or service errors
        const errorMessage = error.message.includes("Deepgram")
            ? "Engine Error: Deepgram API rejected the processing request."
            : "Processing Error: An internal fault occurred during synthesis.";

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    } finally {
        // 4. Cleanup: Delete local file after processing (even if transcription fails)
        if (await fs.pathExists(filePath)) {
            await fs.unlink(filePath);
        }
    }
});

// @desc    Get all transcriptions for a user
// @route   GET /api/history
// @access  Public
export const getTranscriptions = asyncHandler(async (req, res) => {
    const { userId } = req.query;

    let query = {};
    if (userId) {
        query.userId = userId;
    }

    const transcriptions = await Transcription.find(query).sort({ createdAt: -1 });

    res.json({
        success: true,
        data: transcriptions,
    });
});

// @desc    Delete a transcription
// @route   DELETE /api/history/:id
// @access  Public
export const deleteTranscription = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;

    const transcription = await Transcription.findById(id);

    if (!transcription) {
        res.status(404);
        throw new Error("Transcription not found");
    }

    // Ownership check: only the creator can delete their own record
    if (transcription.userId && userId && transcription.userId !== userId) {
        res.status(403);
        throw new Error("Access denied: You do not own this record.");
    }

    await transcription.deleteOne();

    res.json({
        success: true,
        message: "Transcription removed",
    });
});
