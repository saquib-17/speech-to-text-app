import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../server.js";
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

describe("Health Check Endpoint", () => {
  it("GET /api/health should return 200 and healthy status without sensitive details", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("healthy");
    expect(res.body.data.version).toBe("2.0.0");
    expect(res.body.data.database).toBe("connected");
  });
});

describe("Authentication & Security (/api/auth)", () => {
  const validUser = {
    name: "Alex Mercer",
    email: "alex@example.com",
    password: "Password123!",
  };

  // 1. Successful registration
  it("1. should successfully register a new user and return a JWT", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("alex@example.com");
    expect(res.body.data.user.name).toBe("Alex Mercer");
    // Assert password hash is never exposed
    expect(res.body.data.user.password).toBeUndefined();
  });

  // 2. Duplicate email registration
  it("2. should reject duplicate email registration with 409 Conflict", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const duplicateRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Alex Imposter",
        email: "alex@example.com",
        password: "OtherPassword123!",
      });

    expect(duplicateRes.statusCode).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toContain("already exists");
  });

  // 3. Successful login
  it("3. should successfully log in an existing user and return a JWT", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "alex@example.com",
        password: "Password123!",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("alex@example.com");
  });

  // 4. Incorrect password
  it("4. should reject login with incorrect password with 401 Unauthorized", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "alex@example.com",
        password: "WrongPassword999!",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid email or password");
  });

  // 5. Invalid JWT
  it("5. should reject access with an invalid or malformed JWT with 401 Unauthorized", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.forged.token");

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 6. Protected endpoint access without token
  it("6. should reject access to protected endpoint when Authorization header is missing", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("token is missing");
  });

  // Valid token access
  it("should return profile for authenticated user on GET /api/auth/me", async () => {
    const regRes = await request(app).post("/api/auth/register").send(validUser);
    const token = regRes.body.data.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("alex@example.com");
  });
});

describe("Transcript Management & Ownership Protection (/api/transcripts)", () => {
  let userAToken;
  let userBToken;

  beforeEach(async () => {
    // Register User A
    const userARes = await request(app)
      .post("/api/auth/register")
      .send({ name: "User A", email: "userA@example.com", password: "Password123!" });
    userAToken = userARes.body.data.token;

    // Register User B
    const userBRes = await request(app)
      .post("/api/auth/register")
      .send({ name: "User B", email: "userB@example.com", password: "Password123!" });
    userBToken = userBRes.body.data.token;
  });

  // 7. Transcript creation
  it("7. should allow an authenticated user to create a transcript", async () => {
    const res = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Lecture on Operating Systems",
        transcriptionText: "Virtual memory maps addresses to physical RAM pages.",
        originalText: "Virtual memory maps addresses to physical RAM pages.",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Lecture on Operating Systems");
    expect(res.body.data.transcriptionText).toBe("Virtual memory maps addresses to physical RAM pages.");
    expect(res.body.data.user).toBeDefined();
  });

  // 8. Transcript retrieval
  it("8. should allow the owner to retrieve their transcript by ID", async () => {
    const createRes = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Algorithm Complexity",
        transcriptionText: "Binary search runs in logarithmic time.",
      });

    const transcriptId = createRes.body.data._id;

    const getRes = await request(app)
      .get(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data._id).toBe(transcriptId);
    expect(getRes.body.data.title).toBe("Algorithm Complexity");
  });

  // 9. Transcript ownership: User B cannot read User A's transcript
  it("9. should forbid User B from accessing User A's transcript (403 Forbidden)", async () => {
    const createRes = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Confidential Strategy",
        transcriptionText: "Q4 financial review.",
      });

    const transcriptId = createRes.body.data._id;

    // User B attempts to access User A's transcript
    const unauthorizedRes = await request(app)
      .get(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(unauthorizedRes.statusCode).toBe(403);
    expect(unauthorizedRes.body.success).toBe(false);
    expect(unauthorizedRes.body.message).toContain("Access denied");
  });

  // 10. Unauthorized update: User B cannot update User A's transcript
  it("10. should forbid User B from updating User A's transcript (403 Forbidden)", async () => {
    const createRes = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Original Title",
        transcriptionText: "Original text.",
      });

    const transcriptId = createRes.body.data._id;

    // User B attempts to edit User A's transcript
    const updateRes = await request(app)
      .patch(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({
        title: "Hacked Title",
        transcriptionText: "Defaced text.",
      });

    expect(updateRes.statusCode).toBe(403);
    expect(updateRes.body.success).toBe(false);

    // Verify transcript remained unchanged
    const verifyRes = await request(app)
      .get(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userAToken}`);
    expect(verifyRes.body.data.title).toBe("Original Title");
  });

  // Owner CAN update their own transcript
  it("should allow the owner to update their own transcript", async () => {
    const createRes = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Draft Title",
        transcriptionText: "Draft text.",
      });

    const transcriptId = createRes.body.data._id;

    const updateRes = await request(app)
      .patch(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Published Title",
        transcriptionText: "Polished transcription text.",
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.title).toBe("Published Title");
    expect(updateRes.body.data.transcriptionText).toBe("Polished transcription text.");
  });

  // 11. Unauthorized deletion: User B cannot delete User A's transcript
  it("11. should forbid User B from deleting User A's transcript (403 Forbidden)", async () => {
    const createRes = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Protected Transcript",
        transcriptionText: "Important meeting notes.",
      });

    const transcriptId = createRes.body.data._id;

    // User B attempts to delete User A's transcript
    const deleteRes = await request(app)
      .delete(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    expect(deleteRes.statusCode).toBe(403);
    expect(deleteRes.body.success).toBe(false);

    // Verify transcript still exists
    const checkRes = await request(app)
      .get(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userAToken}`);
    expect(checkRes.statusCode).toBe(200);
  });

  // Owner CAN delete their own transcript
  it("should allow the owner to delete their own transcript", async () => {
    const createRes = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "To Be Deleted",
        transcriptionText: "Temporary notes.",
      });

    const transcriptId = createRes.body.data._id;

    const deleteRes = await request(app)
      .delete(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify transcript is gone
    const checkRes = await request(app)
      .get(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userAToken}`);
    expect(checkRes.statusCode).toBe(404);
  });

  // 12. Pagination & Isolation
  it("12. should support pagination and return only the authenticated user's records", async () => {
    // Create 12 transcripts for User A
    for (let i = 1; i <= 12; i++) {
      await request(app)
        .post("/api/transcripts")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          title: `User A Transcript ${i}`,
          transcriptionText: `Content for record ${i}`,
        });
    }

    // Create 3 transcripts for User B
    for (let j = 1; j <= 3; j++) {
      await request(app)
        .post("/api/transcripts")
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
          title: `User B Transcript ${j}`,
          transcriptionText: `Content for User B record ${j}`,
        });
    }

    // User A fetches page 1 with limit 5
    const page1Res = await request(app)
      .get("/api/transcripts?page=1&limit=5")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(page1Res.statusCode).toBe(200);
    expect(page1Res.body.data.length).toBe(5);
    expect(page1Res.body.meta.totalCount).toBe(12); // Does NOT include User B's 3 records!
    expect(page1Res.body.meta.totalPages).toBe(3);
    expect(page1Res.body.meta.hasNextPage).toBe(true);

    // User A fetches page 3
    const page3Res = await request(app)
      .get("/api/transcripts?page=3&limit=5")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(page3Res.statusCode).toBe(200);
    expect(page3Res.body.data.length).toBe(2);
    expect(page3Res.body.meta.hasNextPage).toBe(false);

    // Verify all returned records belong to User A
    page1Res.body.data.forEach((item) => {
      expect(item.title).toContain("User A");
    });
  });

  // 13. Validation errors
  it("13. should return 400 Bad Request on invalid inputs", async () => {
    // Invalid registration: short password and invalid email
    const invalidReg = await request(app)
      .post("/api/auth/register")
      .send({ name: "A", email: "notanemail", password: "123" });

    expect(invalidReg.statusCode).toBe(400);
    expect(invalidReg.body.success).toBe(false);

    // Invalid transcript update: empty title
    const createRes = await request(app)
      .post("/api/transcripts")
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        title: "Valid Title",
        transcriptionText: "Valid text.",
      });

    const transcriptId = createRes.body.data._id;

    const invalidUpdate = await request(app)
      .patch(`/api/transcripts/${transcriptId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ title: "" });

    expect(invalidUpdate.statusCode).toBe(400);
    expect(invalidUpdate.body.success).toBe(false);

    // Malformed ObjectId in URL
    const malformedIdRes = await request(app)
      .get("/api/transcripts/123-not-an-id")
      .set("Authorization", `Bearer ${userAToken}`);

    expect(malformedIdRes.statusCode).toBe(400);
    expect(malformedIdRes.body.message).toContain("malformed");
  });
});

