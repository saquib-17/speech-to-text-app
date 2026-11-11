import mongoose from "mongoose";
import env from "./env.js";

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

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (env.NODE_ENV === "development") {
      console.warn(
        `Local MongoDB connection failed (${error.message}). Starting in-memory MongoDB fallback for ₹0 instant dev...`
      );
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const memServer = await MongoMemoryServer.create();
        const memUri = memServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (memErr) {
        console.error(`Failed to launch in-memory MongoDB: ${memErr.message}`);
      }
    }

    console.error(`MongoDB Connection Failed: ${error.message}`);
    if (env.NODE_ENV !== "test") {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
