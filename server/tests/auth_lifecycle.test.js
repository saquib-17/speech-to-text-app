import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../server.js";
import User from "../models/userModel.js";
import { setupTestDB, clearTestDB, teardownTestDB } from "./setup.js";

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("SpeechScribe AI — Authentication & Data Persistence Lifecycle", () => {
  const userCredentials = {
    name: "Alex Mercer",
    email: "alex.mercer@speechscribe.ai",
    password: "SpeechScribe2026!",
  };

  // Scenario 1: New Account Registration & Persistence
  it("Scenario 1: should register a new account successfully and store it in database", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(userCredentials);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(userCredentials.email);
    expect(res.body.data.user.name).toBe(userCredentials.name);
    expect(res.body.data.user.password).toBeUndefined();

    // Verify user exists in database with password hash (using .select("+password"))
    const savedUser = await User.findOne({ email: userCredentials.email }).select("+password");
    expect(savedUser).not.toBeNull();
    expect(savedUser.name).toBe(userCredentials.name);
    // Password must be hashed (starts with $2a$ or $2b$)
    expect(savedUser.password).toMatch(/^\$2[ab]\$/);
    expect(savedUser.password).not.toBe(userCredentials.password);
  });

  // Scenario 2: Logout and Login with Same Credentials
  it("Scenario 2: should successfully log in after registration using the same credentials", async () => {
    // 1. Register user
    await request(app).post("/api/auth/register").send(userCredentials);

    // 2. Simulate login with same credentials (after logout / new session)
    const loginRes = await request(app).post("/api/auth/login").send({
      email: userCredentials.email,
      password: userCredentials.password,
    });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();
    expect(loginRes.body.data.user.email).toBe(userCredentials.email);
    expect(loginRes.body.data.user.name).toBe(userCredentials.name);
    expect(loginRes.body.data.user.password).toBeUndefined();

    // Reject wrong password
    const badLoginRes = await request(app).post("/api/auth/login").send({
      email: userCredentials.email,
      password: "WrongPassword123!",
    });
    expect(badLoginRes.statusCode).toBe(401);
    expect(badLoginRes.body.success).toBe(false);
  });

  // Scenario 3: Persistent User Transcripts Across Auth Cycles
  it("Scenario 3: should retain user transcripts across logout and re-login cycles", async () => {
    // 1. Register user
    const regRes = await request(app).post("/api/auth/register").send(userCredentials);
    const token1 = regRes.body.data.token;

    // 2. Create transcript for user via API endpoint
    const createRes = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "Quarterly Strategy Meeting",
        transcriptionText: "Our primary objective is sovereign speech AI deployment with local Whisper.",
      });

    expect(createRes.statusCode).toBe(201);
    const transcriptId = createRes.body.data._id;

    // 3. User logs out (client discards token1) and logs in again
    const loginRes = await request(app).post("/api/auth/login").send({
      email: userCredentials.email,
      password: userCredentials.password,
    });
    expect(loginRes.statusCode).toBe(200);
    const token2 = loginRes.body.data.token;

    // 4. Retrieve transcripts using new session token
    const fetchRes = await request(app)
      .get("/api/transcripts")
      .set("Authorization", `Bearer ${token2}`);

    expect(fetchRes.statusCode).toBe(200);
    expect(fetchRes.body.success).toBe(true);
    expect(Array.isArray(fetchRes.body.data)).toBe(true);
    expect(fetchRes.body.data).toHaveLength(1);
    expect(fetchRes.body.data[0]._id).toBe(transcriptId);
    expect(fetchRes.body.data[0].title).toBe("Quarterly Strategy Meeting");
  });

  // Scenario 4: Session Restoration via /api/auth/me
  it("Scenario 4: should restore session with valid JWT via /api/auth/me", async () => {
    const regRes = await request(app).post("/api/auth/register").send(userCredentials);
    const token = regRes.body.data.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe(userCredentials.email);
    expect(meRes.body.data.user.name).toBe(userCredentials.name);
    expect(meRes.body.data.user.password).toBeUndefined();
  });

  // Scenario 5: Duplicate Registration Prevention (409 Conflict)
  it("Scenario 5: should reject duplicate registration with 409 Conflict instead of creating parallel account", async () => {
    // First registration
    await request(app).post("/api/auth/register").send(userCredentials);

    // Duplicate registration attempt
    const duplicateRes = await request(app).post("/api/auth/register").send({
      name: "Alex Mercer Clone",
      email: userCredentials.email,
      password: "AnotherPassword123!",
    });

    expect(duplicateRes.statusCode).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toContain("already exists");
  });

  // Scenario 6: Strict User Data Isolation (BOLA Prevention)
  it("Scenario 6: should enforce user isolation so User A cannot access User B's transcripts", async () => {
    // 1. Create User A
    const userARes = await request(app).post("/api/auth/register").send({
      name: "User Alpha",
      email: "alpha@example.com",
      password: "PasswordAlpha123!",
    });
    const tokenA = userARes.body.data.token;

    // 2. Create User B
    const userBRes = await request(app).post("/api/auth/register").send({
      name: "User Beta",
      email: "beta@example.com",
      password: "PasswordBeta123!",
    });
    const tokenB = userBRes.body.data.token;

    // 3. User A creates transcript
    const createRes = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "Alpha Confidential Memo",
        transcriptionText: "Top secret strategy note.",
      });
    expect(createRes.statusCode).toBe(201);
    const transcriptAId = createRes.body.data._id;

    // 4. User B attempts to access User A's transcript directly -> 403 Forbidden
    const directAccessRes = await request(app)
      .get(`/api/transcripts/${transcriptAId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(directAccessRes.statusCode).toBe(403);
    expect(directAccessRes.body.success).toBe(false);

    // 5. User B lists transcripts — should not see Alpha's transcripts
    const listRes = await request(app)
      .get("/api/transcripts")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data).toHaveLength(0);
  });

  // Scenario 7: Public API vs Protected Route Access
  it("Scenario 7: should allow public health check and reject unauthenticated protected access", async () => {
    // Public health check succeeds without token
    const healthRes = await request(app).get("/api/health");
    expect(healthRes.statusCode).toBe(200);
    expect(healthRes.body.success).toBe(true);

    // Protected transcripts route fails with 401 without token
    const unauthRes = await request(app).get("/api/transcripts");
    expect(unauthRes.statusCode).toBe(401);
    expect(unauthRes.body.success).toBe(false);

    // Protected auth/me route fails with 401 without token
    const unauthMeRes = await request(app).get("/api/auth/me");
    expect(unauthMeRes.statusCode).toBe(401);
    expect(unauthMeRes.body.success).toBe(false);
  });

  // Scenario 8: Password Security & Hash Integrity
  it("Scenario 8: should never expose or store plaintext passwords", async () => {
    await request(app).post("/api/auth/register").send(userCredentials);

    const rawUserDoc = await User.findOne({ email: userCredentials.email }).select("+password");
    expect(rawUserDoc.password).not.toBe(userCredentials.password);
    expect(rawUserDoc.password.length).toBeGreaterThanOrEqual(60);

    const isCorrect = await rawUserDoc.comparePassword(userCredentials.password);
    expect(isCorrect).toBe(true);

    const isIncorrect = await rawUserDoc.comparePassword("WrongPassword!");
    expect(isIncorrect).toBe(false);
  });
});
