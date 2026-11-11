import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../server.js";
import { setupTestDB, clearTestDB, teardownTestDB } from "./setup.js";
import { mockSpeechProviderInstance } from "../services/speech/mockProvider.js";
import Transcript from "../models/transcriptionModel.js";

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  mockSpeechProviderInstance.reset();
});

describe("Speech-to-Text & Processing Pipeline (/api/audio/transcribe)", () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Speech Tester",
        email: "speechtester@example.com",
        password: "Password123!",
      });
    authToken = regRes.body.data.token;
    userId = regRes.body.data.user._id;
  });

  // 1. Successful transcription with word timestamps & language detection
  it("1. should transcribe audio file and persist transcript document to MongoDB", async () => {
    const fakeAudioBuffer = Buffer.from("RIFF_WAV_SIMULATED_SPEECH_DATA");

    const res = await request(app)
      .post("/api/audio/transcribe")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "CS MCA Lecture 01")
      .attach("audio", fakeAudioBuffer, {
        filename: "lecture.wav",
        contentType: "audio/wav",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Audio transcribed successfully");

    const transcript = res.body.data;
    expect(transcript._id).toBeDefined();
    expect(transcript.title).toBe("CS MCA Lecture 01");
    expect(transcript.transcriptionText).toBe("SpeechScribe AI mock transcription for testing.");
    expect(transcript.originalText).toBe("SpeechScribe AI mock transcription for testing.");
    expect(transcript.status).toBe("completed");

    // Verify metadata
    expect(transcript.transcriptionMetadata.provider).toBe("mock");
    expect(transcript.transcriptionMetadata.language).toBe("en");
    expect(transcript.transcriptionMetadata.languageProbability).toBe(0.99);
    expect(transcript.transcriptionMetadata.durationSeconds).toBe(2.2);
    expect(transcript.transcriptionMetadata.words.length).toBe(6);
    expect(transcript.transcriptionMetadata.words[0].word).toBe("SpeechScribe");

    // Confirm persisted in database
    const dbRecord = await Transcript.findById(transcript._id);
    expect(dbRecord).not.toBeNull();
    expect(dbRecord.user.toString()).toBe(userId);
  });

  // 2. Transcription with custom language parameter
  it("2. should support passing explicit language hint to speech engine", async () => {
    mockSpeechProviderInstance.setResponse({
      text: "Bonjour et bienvenue à SpeechScribe.",
      words: [{ word: "Bonjour", start: 0, end: 0.5, confidence: 0.99 }],
      language: "fr",
      languageProbability: 0.995,
      durationSeconds: 1.5,
    });

    const fakeAudioBuffer = Buffer.from("FAKE_FRENCH_AUDIO");

    const res = await request(app)
      .post("/api/audio/transcribe")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "French Presentation")
      .field("language", "fr")
      .attach("audio", fakeAudioBuffer, {
        filename: "french.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.transcriptionMetadata.language).toBe("fr");
    expect(res.body.data.transcriptionText).toBe("Bonjour et bienvenue à SpeechScribe.");
  });

  // 3. Graceful handling of speech service failure (503 Service Unavailable)
  it("3. should return 503 Service Unavailable when local speech engine is offline", async () => {
    mockSpeechProviderInstance.setFail(
      true,
      503,
      "Local Faster-Whisper speech service is unavailable on 127.0.0.1:5001."
    );

    const fakeAudioBuffer = Buffer.from("AUDIO_STREAM");

    const res = await request(app)
      .post("/api/audio/transcribe")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("audio", fakeAudioBuffer, {
        filename: "sample.mp3",
        contentType: "audio/mpeg",
      });

    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Faster-Whisper speech service is unavailable");
  });

  // 4. Missing authentication
  it("4. should reject unauthenticated transcription requests with 401 Unauthorized", async () => {
    const fakeBuffer = Buffer.from("AUDIO_DATA");

    const res = await request(app)
      .post("/api/audio/transcribe")
      .attach("audio", fakeBuffer, {
        filename: "notes.wav",
        contentType: "audio/wav",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 5. Missing audio file
  it("5. should return 400 Bad Request when audio file is missing", async () => {
    const res = await request(app)
      .post("/api/audio/transcribe")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Audio with no file");

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("No audio file detected");
  });
});
