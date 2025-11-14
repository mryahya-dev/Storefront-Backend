// spec/helpers/db-helpers.ts
import { pool } from "../../src/db";

export async function resetTestDb() {
  await pool.query("DELETE FROM orders");
  await pool.query("DELETE FROM products");
  await pool.query("DELETE FROM users");
}
