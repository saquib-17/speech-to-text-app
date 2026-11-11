import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

/**
 * Validates and normalizes environment variables.
 * In accordance with Phase 03 PRD:
 * - PORT, MONGO_URI, JWT_SECRET are required in production (or MONGO_URI can be supplied by in-memory DB during tests).
 * - DEEPGRAM_API_KEY and GEMINI_API_KEY are STRICTLY OPTIONAL; the server starts without them.
 */
const validateEnv = () => {
  const isTest = process.env.NODE_ENV === "test";

  // In test mode, provide safe defaults for in-memory testing
  const jwtSecret = process.env.JWT_SECRET || (isTest ? "speechscribe_jwt_test_secret_32_characters_long" : null);

  const required = [];
  if (!isTest) {
    if (!process.env.MONGO_URI) required.push("MONGO_URI");
    if (!process.env.JWT_SECRET) required.push("JWT_SECRET");
  }

  if (required.length > 0) {
    console.error(`FATAL: Missing required environment variable(s): ${required.join(", ")}`);
    process.exit(1);
  }

  return {
    PORT: parseInt(process.env.PORT, 10) || 5000,
    MONGO_URI: process.env.MONGO_URI || "",
    JWT_SECRET: jwtSecret || "speechscribe_fallback_jwt_secret_32_chars_long",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY || null,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || null,
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    NODE_ENV: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
  };
};

export const env = validateEnv();
export default env;
