import { HTTP_STATUS } from "../config/constants.js";

/**
 * Standardized success response envelope
 */
export const sendSuccess = (res, { statusCode = HTTP_STATUS.OK, message = "Operation successful", data = null, meta = null }) => {
  const payload = {
    success: true,
    statusCode,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Standardized error response envelope
 */
export const sendError = (res, { statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, error = "Server Error", message = "An error occurred", details = null }) => {
  const payload = {
    success: false,
    statusCode,
    error,
    message,
  };

  if (details) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};

