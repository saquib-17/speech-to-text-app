import { verifyToken } from "../utils/tokenUtils.js";
import { sendError } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import User from "../models/userModel.js";

/**
 * Authentication Middleware
 * Enforces valid Bearer JWT on protected endpoints and injects `req.user`.
 * Never trusts user IDs supplied by the frontend.
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      error: "Unauthorized",
      message: "Access denied. Authentication token is missing.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    // Verify user still exists in database
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      return sendError(res, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        error: "Unauthorized",
        message: "User account associated with this session no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid or forged authentication token.";

    return sendError(res, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      error: "Unauthorized",
      message,
    });
  }
};

