import express from "express";
import mongoose from "mongoose";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

const router = express.Router();

router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: "SpeechScribe API is operating normally.",
    data: {
      status: "healthy",
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatusMap[dbState] || "unknown",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    },
  });
});

export default router;

