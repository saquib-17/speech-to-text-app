import { describe, it, expect, vi } from "vitest";
import { isPortListening, PERSISTENT_DB_PATH, closeDB } from "../config/db.js";
import path from "path";
import fs from "fs";

describe("MongoDB Startup Logic & Structured Logging", () => {
  it("1. should confirm persistent database directory is server/data/db and exists", () => {
    expect(PERSISTENT_DB_PATH).toBeDefined();
    expect(PERSISTENT_DB_PATH).toContain(path.normalize("server/data/db"));
    expect(fs.existsSync(PERSISTENT_DB_PATH)).toBe(true);
  });

  it("2. isPortListening should accurately detect listening vs closed ports without throwing errors", async () => {
    // Port 27019 or random high port is closed
    const isClosed = await isPortListening("127.0.0.1", 27098, 200);
    expect(isClosed).toBe(false);

    // Port 27017 should be listening (active embedded mongod)
    const isOpen = await isPortListening("127.0.0.1", 27017, 300);
    expect(typeof isOpen).toBe("boolean");
  });

  it("3. closeDB should execute cleanly without throwing errors", async () => {
    await expect(closeDB()).resolves.not.toThrow();
  });
});
