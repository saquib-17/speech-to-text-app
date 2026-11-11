import { HTTP_STATUS } from "../config/constants.js";
import env from "../config/env.js";

/**
 * 404 Not Found Middleware
 */
export const notFound = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    statusCode: HTTP_STATUS.NOT_FOUND,
    error: "Not Found",
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Centralized Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR);
  let errorName = err.name || "Error";
  let message = err.message || "An internal server error occurred.";

  // Multer: File too large
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = HTTP_STATUS.PAYLOAD_TOO_LARGE;
    errorName = "Payload Too Large";
    message = "Audio file exceeds maximum size limit of 25 MB.";
  } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorName = "Bad Request";
    message = `Unexpected upload field '${err.field || "unknown"}'. Audio file must be attached under the 'audio' form field.`;
  } else if (err.name === "MulterError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorName = "Bad Request";
    message = err.message || "Invalid multipart upload format.";
  }

  // Mongoose: CastError (Invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorName = "Bad Request";
    message = `Malformed resource identifier for field: ${err.path}`;
  }

  // Mongoose: Duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    errorName = "Conflict";
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `An account with this ${field} already exists.`;
  }

  // Mongoose: Schema validation error
  if (err.name === "ValidationError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorName = "Validation Error";
    message = Object.values(err.errors).map((e) => e.message).join(" ");
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorName = "Unauthorized";
  }

  // HTTP 429 Quota Exceeded / Rate Limit
  if (err.statusCode === HTTP_STATUS.TOO_MANY_REQUESTS || statusCode === HTTP_STATUS.TOO_MANY_REQUESTS) {
    statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
    errorName = "Too Many Requests";
    if (err.retryAfter) {
      res.setHeader("Retry-After", String(err.retryAfter));
    }
  }

  const responsePayload = {
    success: false,
    statusCode,
    error: errorName,
    message,
    details: err.details || null,
  };

  if (err.retryAfter !== undefined) {
    responsePayload.retryAfter = err.retryAfter;
  }
  if (err.retryAt !== undefined) {
    responsePayload.retryAt = err.retryAt;
  }
  if (err.isQuotaExceeded !== undefined) {
    responsePayload.isQuotaExceeded = err.isQuotaExceeded;
  }

  // Only expose stack trace in non-production environments
  if (!env.isProduction) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};
