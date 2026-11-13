import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import net from "net";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import env from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verified persistent database directory: server/data/db
 * Holds persistent collections (users, transcripts, aiInsights).
 * Never deleted, wiped, or recreated.
 */
export const PERSISTENT_DB_PATH = path.resolve(__dirname, "../data/db");

// Process tracking & launch synchronization
let spawnedMongodProcess = null;
let mongodLaunchPromise = null;
let isShuttingDown = false;

/**
 * Probes whether a TCP port is actively accepting connections
 * @param {string} host
 * @param {number} port
 * @param {number} [timeoutMs=800]
 * @returns {Promise<boolean>}
 */
export const isPortListening = (host, port, timeoutMs = 800) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.setTimeout(timeoutMs);

    socket.once("connect", () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(true);
      }
    });

    socket.once("timeout", () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(false);
      }
    });

    socket.once("error", () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(false);
      }
    });

    try {
      socket.connect(port, host);
    } catch (_) {
      resolve(false);
    }
  });
};

/**
 * Launches persistent embedded MongoDB engine bound to server/data/db
 * Safe concurrency: Reuses existing process or active launch Promise.
 *
 * @param {number} [port=27017]
 * @returns {Promise<void>}
 */
const startPersistentLocalMongod = async (port = 27017) => {
  if (spawnedMongodProcess) return;
  if (mongodLaunchPromise) return mongodLaunchPromise;

  mongodLaunchPromise = (async () => {
    // 1. Guard against port collision: If another mongod is already running on port, connect to it
    const isAlreadyOpen = await isPortListening("127.0.0.1", port, 400);
    if (isAlreadyOpen) {
      console.log(`[Database] Port ${port} is already active. Reusing running MongoDB engine.`);
      return;
    }

    // 2. Ensure persistent database directory exists (never deleted or reset)
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
    } catch (_) {
      // Fall back to system-installed mongod
    }

    console.log(`[Database] Starting persistent embedded MongoDB engine at: ${PERSISTENT_DB_PATH} (port ${port})`);
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
      if (!isShuttingDown) {
        console.error(`[Database] Persistent MongoDB process error: ${err.message}`);
      }
      spawnedMongodProcess = null;
    });

    child.on("exit", (code) => {
      if (!isShuttingDown && code !== null && code !== 0) {
        console.warn(`[Database] Persistent MongoDB process exited with code ${code}`);
      }
      spawnedMongodProcess = null;
    });
  })();

  try {
    await mongodLaunchPromise;
  } finally {
    mongodLaunchPromise = null;
  }
};

/**
 * Connects to MongoDB with smart fallback:
 * 1. Checks if standalone MongoDB is running on host:port.
 * 2. If standalone is unavailable, logs an informational message (not an error)
 *    and launches persistent embedded MongoDB at server/data/db.
 * 3. Logs actual errors only if all connection strategies fail.
 *
 * @param {string|null} [customUri=null]
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async (customUri = null) => {
  const uri = customUri || env.MONGO_URI;

  if (!uri) {
    if (env.NODE_ENV === "test") {
      return null;
    }
    console.error("[Database] Fatal Error: MONGO_URI is not defined.");
    process.exit(1);
  }

  // Reuse existing active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Parse URI parameters
  const hostMatch = uri.match(/mongodb(?:\+srv)?:\/\/(?:[^@]+@)?([^:/]+)/);
  const portMatch = uri.match(/:(\d+)/);
  const host = hostMatch ? hostMatch[1] : "127.0.0.1";
  const port = portMatch ? parseInt(portMatch[1], 10) : 27017;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const checkHost = host === "localhost" ? "127.0.0.1" : host;

  // Handle remote non-local MongoDB connections (e.g. MongoDB Atlas)
  if (!isLocal) {
    console.log(`[Database] Connecting to remote MongoDB cluster (${host})...`);
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[Database] Connected successfully to remote MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (remoteErr) {
      console.error(`[Database] Fatal Error: Failed to connect to remote MongoDB: ${remoteErr.message}`);
      if (env.NODE_ENV !== "test") {
        process.exit(1);
      }
      throw remoteErr;
    }
  }

  // --- LOCAL CONNECTION STRATEGY ---
  // Step 1: Check if standalone MongoDB is already listening on the port
  const isStandaloneListening = await isPortListening(checkHost, port, 600);

  if (isStandaloneListening) {
    console.log(`[Database] Active MongoDB service detected on ${host}:${port}. Connecting...`);
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
      console.log(`[Database] Connected successfully to MongoDB: ${conn.connection.host}:${conn.connection.port || port}`);
      return conn;
    } catch (directErr) {
      // If port was open but connection handshake failed, treat as informational and attempt embedded fallback
      console.log(
        `[Database] Port ${port} is active but Mongoose handshake was rejected (${directErr.message}). Attempting embedded fallback...`
      );
    }
  } else {
    // Step 2: Standalone MongoDB is not running — Treat as INFORMATIONAL (not an error)
    console.log(
      `[Database] Standalone MongoDB is not running on ${host}:${port}. Initializing persistent embedded fallback...`
    );
  }

  // Step 3: Launch persistent embedded MongoDB engine
  try {
    await startPersistentLocalMongod(port);

    // Poll until port becomes ready (up to 15 attempts * 400ms)
    const maxAttempts = 15;
    let isEmbeddedReady = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const ready = await isPortListening(checkHost, port, 400);
      if (ready) {
        isEmbeddedReady = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    if (isEmbeddedReady) {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(
        `[Database] Connected successfully to persistent embedded MongoDB: ${conn.connection.host}:${conn.connection.port || port} (${PERSISTENT_DB_PATH})`
      );
      return conn;
    } else {
      throw new Error(`Embedded engine did not open port ${port} within timeout.`);
    }
  } catch (embeddedErr) {
    // Step 4: BOTH standalone and persistent embedded failed — Log actual error
    console.error(`[Database] Error: Failed to start persistent embedded MongoDB: ${embeddedErr.message}`);

    // Last-ditch transient in-memory fallback
    try {
      console.log("[Database] Attempting transient in-memory MongoDB fallback...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const memServer = await MongoMemoryServer.create();
      const memUri = memServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] Connected to fallback in-memory MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (memErr) {
      console.error(`[Database] Fatal Error: Could not connect to any MongoDB instance: ${memErr.message}`);
      if (env.NODE_ENV !== "test") {
        process.exit(1);
      }
      throw memErr;
    }
  }
};

/**
 * Graceful cleanup of database connections and background processes
 */
export const closeDB = async () => {
  isShuttingDown = true;
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
      console.log("[Database] Mongoose connection closed cleanly.");
    } catch (err) {
      console.warn(`[Database] Notice: Closing connection encountered: ${err.message}`);
    }
  }
  if (spawnedMongodProcess) {
    try {
      spawnedMongodProcess.kill();
      console.log("[Database] Persistent embedded MongoDB process terminated cleanly.");
    } catch (_) {}
    spawnedMongodProcess = null;
  }
};

export default connectDB;
