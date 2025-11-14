// spec/products.spec.ts
import request from "supertest";
import app from "./test-app";
import { resetTestDb } from "./helpers/db-helpers";
import { pool } from "../src/db";

describe("Products pagination", () => {
  beforeAll(async () => {
    await resetTestDb();
    // insert 30 products quickly
    for (let i = 1; i <= 30; i++) {
      await pool.query(
        "INSERT INTO products (name, price, category, quantity, remaining_items, created_at, updated_at) VALUES ($1,$2,$3,$4,$5, now(), now())",
        [`prod-${i}`, 10.0 + i, "misc", 100, 100]
      );
    }
  });

  it("returns default limit products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("supports limit & offset", async () => {
    const res = await request(app).get("/api/products?limit=5&offset=10");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(5);
  });
});
