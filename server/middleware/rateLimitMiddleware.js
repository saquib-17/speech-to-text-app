import rateLimit from "express-rate-limit";
import env from "../config/env.js";

/**
 * Rate Limiter for Authentication Endpoints (Brute-force protection)
 * 15-minute window, 10 requests per IP in production.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "test" ? 1000 : 10,
  message: {
    success: false,
    statusCode: 429,
    error: "Too Many Requests",
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API Rate Limiter
 * 15-minute window, 300 requests per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "test" ? 5000 : 300,
  message: {
    success: false,
    statusCode: 429,
    error: "Too Many Requests",
    message: "Rate limit exceeded. Please throttle your requests.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

