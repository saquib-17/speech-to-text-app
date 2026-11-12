import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import env from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSISTENT_DB_PATH = path.resolve(__dirname, "../data/db");

let spawnedMongodProcess = null;

const startPersistentLocalMongod = async (port = 27017) => {
  if (spawnedMongodProcess) return;

  if (!fs.existsSync(PERSISTENT_DB_PATH)) {
    fs.mkdirSync(PERSISTENT_DB_PATH, { recursive: true });
  }

  let mongodBin = "mongod";
  try {
    const { MongoBinary } = await import("mongodb-memory-server");
    const downloadedBin = await MongoBinary.getPath();
    if (downloadedBin && fs.existsSync(downloadedBin)) {
      mongodBin = downloadedBin;
    }
  } catch (err) {
    // Fall back to system mongod
  }

  console.log(`Starting persistent local MongoDB at: ${PERSISTENT_DB_PATH} (port ${port})`);
  const child = spawn(
    mongodBin,
    ["--dbpath", PERSISTENT_DB_PATH, "--port", String(port), "--bind_ip", "127.0.0.1"],
    {
      stdio: "ignore",
      detached: false,
    }
  );

  spawnedMongodProcess = child;

  const cleanup = () => {
    if (spawnedMongodProcess) {
      try {
        spawnedMongodProcess.kill();
      } catch (_) {}
      spawnedMongodProcess = null;
    }
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });

  child.on("error", (err) => {
    console.error(`Persistent MongoDB process error: ${err.message}`);
    spawnedMongodProcess = null;
  });

  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.warn(`Persistent MongoDB process exited with code ${code}`);
    }
    spawnedMongodProcess = null;
  });
};

const connectDB = async (customUri = null) => {
  const uri = customUri || env.MONGO_URI;

  if (!uri) {
    if (env.NODE_ENV === "test") {
      return null;
    }
    console.error("MongoDB Connection Error: MONGO_URI is not defined.");
    process.exit(1);
  }

  // If already connected, reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 1. Try initial connection to provided MONGO_URI
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (initialErr) {
    const isLocal = uri.includes("localhost") || uri.includes("127.0.0.1");
    if (env.NODE_ENV === "test" || !isLocal) {
      console.error(`MongoDB Connection Failed: ${initialErr.message}`);
      if (env.NODE_ENV !== "test") {
        process.exit(1);
      }
      throw initialErr;
    }

    // 2. Local MongoDB not running — launch persistent embedded MongoDB
    console.warn(
      `Local MongoDB connection failed (${initialErr.message}). Launching persistent embedded MongoDB at ${PERSISTENT_DB_PATH}...`
    );

    try {
      const portMatch = uri.match(/:(\d+)/);
      const port = portMatch ? parseInt(portMatch[1], 10) : 27017;

      await startPersistentLocalMongod(port);

      // Poll connection until ready (up to 15 retries)
      const maxRetries = 15;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await new Promise((r) => setTimeout(r, 600));
          const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
          console.log(`Persistent MongoDB Connected: ${conn.connection.host} (${PERSISTENT_DB_PATH})`);
          return conn;
        } catch (retryErr) {
          if (attempt === maxRetries) {
            throw retryErr;
          }
        }
      }
    } catch (launchErr) {
      console.error(`Failed to start persistent MongoDB: ${launchErr.message}`);
      // Fallback to in-memory if persistent launch fails
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const memServer = await MongoMemoryServer.create();
        const memUri = memServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`Fallback In-Memory MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (memErr) {
        console.error(`Fatal: could not connect to any MongoDB instance: ${memErr.message}`);
        process.exit(1);
      }
    }
  }
};

export default connectDB;
