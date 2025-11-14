// spec/orders.spec.ts
import request from "supertest";
import app from "./test-app";
import { resetTestDb } from "./helpers/db-helpers";
import { pool } from "../src/db";

let token: string;
let productId: string;

describe("Orders", () => {
  beforeAll(async () => {
    await resetTestDb();

    // create user
    await request(app).post("/api/auth/register").send({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
    });

    const login = await request(app).post("/api/auth/login").send({
      email: "bob@example.com",
      password: "password123",
    });
    token = login.body.token;

    const p = await pool.query(
      "INSERT INTO products (name, price, category, quantity, remaining_items, created_at, updated_at) VALUES ($1,$2,$3,$4,$5, now(), now()) RETURNING id",
      ["TestProd", 50.0, "misc", 10, 10]
    );
    productId = p.rows[0].id;
  });

  it("creates an order and decreases remaining_items", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          { product_id: productId, name: "TestProd", price: 50.0, quantity: 2 },
        ],
      });

    expect(res.status).toBe(201);
    const prod = await pool.query(
      "SELECT remaining_items FROM products WHERE id = $1",
      [productId]
    );
    expect(prod.rows[0].remaining_items).toBe(8);
  });

  it("prevents oversell", async () => {
    // attempt to buy more than remaining
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          {
            product_id: productId,
            name: "TestProd",
            price: 50.0,
            quantity: 1000,
          },
        ],
      });

    expect(res.status).toBe(400);
  });
});
