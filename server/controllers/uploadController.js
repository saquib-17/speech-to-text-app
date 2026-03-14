import asyncHandler from "express-async-handler";
import fs from "fs-extra";
import { transcribeAudio } from "../services/deepgramService.js";
import Transcription from "../models/transcriptionModel.js";

// @desc    Upload audio and get transcription
// @route   POST /api/upload
// @access  Public
export const uploadAudio = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error("Please upload an audio file");
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
            message: "Transcription successful",
            data: transcription,
        });
    } finally {
        // 4. Cleanup: Delete local file after processing (even if transcription fails)
        if (await fs.pathExists(filePath)) {
            await fs.unlink(filePath);
        }
    }
});

// @desc    Get all transcriptions for a user
// @route   GET /api/transcriptions
// @access  Public (Will restrict with Auth later)
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
// @access  Public (Will restrict with Auth later)
export const deleteTranscription = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const transcription = await Transcription.findById(id);

    if (!transcription) {
        res.status(404);
        throw new Error("Transcription not found");
    }

    await transcription.deleteOne();

    res.json({
        success: true,
        message: "Transcription removed",
    });
});
