import mongoose from "mongoose";
import Transcript from "../models/transcriptionModel.js";
import { sendError } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * Ownership Verification Middleware
 * Guarantees that the authenticated user (`req.user`) is the owner of the target transcript.
 * Blocks BOLA (Broken Object Level Authorization) attacks.
 */
export const verifyTranscriptOwnership = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      error: "Bad Request",
      message: "Resource identifier is malformed.",
    });
  }

  try {
    const transcript = await Transcript.findById(id);

    if (!transcript) {
      return sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        error: "Not Found",
        message: "Transcript not found.",
      });
    }

    // Compare transcript owner ID with authenticated user ID
    const userId = req.user._id ? req.user._id.toString() : req.user.id.toString();
    const ownerId = transcript.user.toString();

    if (ownerId !== userId) {
      return sendError(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        error: "Forbidden",
        message: "Access denied. You do not own this transcript.",
      });
    }

    // Attach verified transcript to avoid duplicate DB query in controller
    req.transcript = transcript;
    next();
  } catch (error) {
    next(error);
  }
};

