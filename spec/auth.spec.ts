// spec/auth.spec.ts
import request from "supertest";
import app from "./test-app";
import { resetTestDb } from "./helpers/db-helpers";

describe("Auth: register & login", () => {
  beforeAll(async () => {
    await resetTestDb();
  });

  it("rejects short password", async () => {
    const short = await request(app).post("/api/auth/register").send({
      name: "Short",
      email: "short@example.com",
      password: "123",
    });
    expect(short.status).toBe(400);
  });

  it("registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "strongpassword",
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("alice@example.com");
  });

  it("logs in and returns token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "alice@example.com",
      password: "strongpassword",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
  });
});
