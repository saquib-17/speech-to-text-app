import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows cross-origin REST clients and previews
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Restricted CORS Configuration
const allowedOrigins = [
  env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://speechscribeai.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, automated tests)
      if (!origin || allowedOrigins.includes(origin) || !env.isProduction) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS policy."));
      }
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Logging (only in non-test environments)
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.isProduction ? "combined" : "dev"));
}

// Request Body Parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Mount Unified API Routes
app.use("/api", apiRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SpeechScribe AI v2 API is running.",
    version: "2.0.0",
    docs: "/api/health",
  });
});

// Centralized Error Handling Pipeline
app.use(notFound);
app.use(errorHandler);

// Server Startup Logic
let server = null;

if (env.NODE_ENV !== "test") {
  // Connect to Database
  connectDB();

  server = app.listen(env.PORT, () => {
    console.log(`SpeechScribe API v2 running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // Graceful Shutdown
  const shutdown = (signal) => {
    console.log(`${signal} signal received: closing HTTP server`);
    if (server) {
      server.close(() => {
        console.log("HTTP server closed cleanly.");
        process.exit(0);
      });
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;
