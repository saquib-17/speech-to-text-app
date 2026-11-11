import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../server.js";
import { setupTestDB, clearTestDB, teardownTestDB } from "./setup.js";
import {
  sanitizeFilename,
  validateAudioPayload,
  processAudioIngestion,
  releaseAudioBuffer,
} from "../services/audioService.js";
import { MAX_AUDIO_FILE_SIZE } from "../config/constants.js";

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("Audio Ingestion & Recording Pipeline (/api/audio)", () => {
  let authToken;

  beforeEach(async () => {
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Audio Tester",
        email: "audiotester@example.com",
        password: "Password123!",
      });
    authToken = regRes.body.data.token;
  });

  // 1. Successful audio upload
  it("1. should successfully upload an MP3 audio file and return normalized metadata", async () => {
    const fakeAudioBuffer = Buffer.from("ID3_FAKE_MP3_HEADER_AND_AUDIO_FRAMES_DATA");

    const res = await request(app)
      .post("/api/audio/upload")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("audio", fakeAudioBuffer, {
        filename: "presentation_lecture.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("uploaded and verified");
    expect(res.body.data.audioId).toMatch(/^aud_[a-f0-9]{16}$/);
    expect(res.body.data.originalName).toBe("presentation_lecture.mp3");
    expect(res.body.data.mimeType).toBe("audio/mpeg");
    expect(res.body.data.format).toBe("mp3");
    expect(res.body.data.sizeBytes).toBe(fakeAudioBuffer.length);
    expect(res.body.data.source).toBe("upload");
    expect(res.body.data.status).toBe("ready_for_transcription");
    expect(res.body.data.createdAt).toBeDefined();
  });

  // 2. Successful recording submission
  it("2. should successfully ingest a browser microphone recording (WebM)", async () => {
    const fakeRecordingBuffer = Buffer.from("RIFF_FAKE_WEBM_OPUS_RECORDING_DATA");

    const res = await request(app)
      .post("/api/audio/recording")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Quick Voice Note")
      .attach("audio", fakeRecordingBuffer, {
        filename: "blob",
        contentType: "audio/webm",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("recording submitted and verified");
    expect(res.body.data.source).toBe("recording");
    expect(res.body.data.format).toBe("webm");
    expect(res.body.data.title).toBe("Quick Voice Note");
    expect(res.body.data.originalName).toMatch(/^recording_.*\.webm$/);
    expect(res.body.data.sizeBytes).toBe(fakeRecordingBuffer.length);
  });

  // 3. Missing authentication
  it("3. should reject audio upload when Authorization header is missing (401 Unauthorized)", async () => {
    const fakeBuffer = Buffer.from("AUDIO_DATA");

    const res = await request(app)
      .post("/api/audio/upload")
      .attach("audio", fakeBuffer, {
        filename: "speech.wav",
        contentType: "audio/wav",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Authentication token is missing");
  });

  it("should reject recording submission when Authorization header is missing (401 Unauthorized)", async () => {
    const fakeBuffer = Buffer.from("AUDIO_DATA");

    const res = await request(app)
      .post("/api/audio/recording")
      .attach("audio", fakeBuffer, {
        filename: "recording.wav",
        contentType: "audio/wav",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 4. Missing audio file
  it("4. should return 400 Bad Request when no audio file is attached in multipart form", async () => {
    const res = await request(app)
      .post("/api/audio/upload")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Lecture without audio file");

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("No audio file detected");
  });

  // 5. Unsupported MIME type
  it("5. should reject unsupported file formats (e.g. PDF/text) with 400 Bad Request", async () => {
    const fakeTextBuffer = Buffer.from("This is a plain text file, not an audio file.");

    const res = await request(app)
      .post("/api/audio/upload")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("audio", fakeTextBuffer, {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid audio file format");
  });

  it("should reject audio with spoofed MIME but disallowed extension (e.g. .exe)", async () => {
    const fakeBuffer = Buffer.from("FAKE_DATA");

    const res = await request(app)
      .post("/api/audio/upload")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("audio", fakeBuffer, {
        filename: "payload.exe",
        contentType: "audio/mpeg",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid File Extension");
  });

  // 6. Oversized audio file
  it("6. should reject audio files exceeding the 25 MB limit with 413 Payload Too Large", async () => {
    // Construct a buffer exceeding 25 MB
    const oversizedBuffer = Buffer.alloc(MAX_AUDIO_FILE_SIZE + 1024);

    const res = await request(app)
      .post("/api/audio/upload")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("audio", oversizedBuffer, {
        filename: "huge_file.wav",
        contentType: "audio/wav",
      });

    expect(res.statusCode).toBe(413);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Payload Too Large");
    expect(res.body.message).toContain("25 MB");
  });

  // 7. Empty audio file
  it("7. should reject empty audio files (0 bytes) with 400 Bad Request", async () => {
    const emptyBuffer = Buffer.alloc(0);

    const res = await request(app)
      .post("/api/audio/upload")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("audio", emptyBuffer, {
        filename: "silent_zero_bytes.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("0 bytes");
  });

  // 8. Invalid request format (wrong field name)
  it("8. should return 400 Bad Request when audio is sent under an unexpected field name", async () => {
    const fakeBuffer = Buffer.from("AUDIO_DATA");

    const res = await request(app)
      .post("/api/audio/upload")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("file", fakeBuffer, {
        filename: "speech.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("field 'file'");
  });

  // 9. Temporary resource cleanup & buffer release
  it("9. should verify that releaseAudioBuffer successfully frees the in-memory buffer", () => {
    const fakeFile = {
      originalname: "test.wav",
      mimetype: "audio/wav",
      size: 1024,
      buffer: Buffer.alloc(1024),
    };

    const descriptor = processAudioIngestion(fakeFile, {
      source: "upload",
      userId: "test_user_id",
    });

    expect(descriptor.buffer).toBeDefined();
    expect(descriptor.buffer.length).toBe(1024);

    // Execute cleanup
    releaseAudioBuffer(descriptor);

    // Verify buffer was released
    expect(descriptor.buffer).toBeNull();
  });

  // 10. Correct audio metadata response & filename sanitization
  it("10. should sanitize dangerous filenames (path traversal, control chars) and preserve metadata integrity", async () => {
    const fakeBuffer = Buffer.from("AUDIO_CONTENT");

    const res = await request(app)
      .post("/api/audio/upload")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("audio", fakeBuffer, {
        filename: "../../../etc/passwd_evil.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    // Asserts path traversal characters were stripped
    expect(res.body.data.originalName).not.toContain("../");
    expect(res.body.data.originalName).toBe("passwd_evil.mp3");
    expect(res.body.data.format).toBe("mp3");
  });

  it("should support all approved browser audio MIME formats", async () => {
    const supportedFormats = [
      { ext: "wav", mime: "audio/wav" },
      { ext: "webm", mime: "audio/webm" },
      { ext: "m4a", mime: "audio/x-m4a" },
      { ext: "aac", mime: "audio/aac" },
      { ext: "ogg", mime: "audio/ogg" },
      { ext: "mp4", mime: "audio/mp4" },
    ];

    for (const fmt of supportedFormats) {
      const res = await request(app)
        .post("/api/audio/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("audio", Buffer.from("DUMMY_AUDIO_DATA"), {
          filename: `test_file.${fmt.ext}`,
          contentType: fmt.mime,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.mimeType).toBe(fmt.mime);
      expect(res.body.data.format).toBe(fmt.ext === "x-m4a" ? "m4a" : fmt.ext);
    }
  });
});

