// src/models/products.model.ts
import { pool } from "../db";

export type ProductRow = {
  id: string;
  name: string;
  description?: string;
  price: string;
  category?: string;
  image_url?: string;
  quantity: number;
  remaining_items: number;
  created_at: Date;
  updated_at: Date;
  image_public_id?: string;
};

export async function createProduct(data: Partial<ProductRow>) {
  const res = await pool.query(
    `INSERT INTO products
     (name, description, price, category, image_url, quantity, remaining_items,image_public_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.name,
      data.description || null,
      data.price,
      data.category || null,
      data.image_url || null,
      data.quantity ?? 0,
      data.remaining_items ?? data.quantity ?? 0,
      data.image_public_id || null,
    ]
  );
  return res.rows[0];
}

export async function listProducts(opts?: { limit?: number; offset?: number }) {
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const res = await pool.query(
    "SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );
  return res.rows;
}

export async function getProductById(id: string) {
  const res = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
  return res.rows[0];
}

export async function updateProduct(id: string, fields: Partial<ProductRow>) {
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = $${idx++}`);
    vals.push(v);
  }
  if (sets.length === 0) return getProductById(id);
  vals.push(id);
  const sql = `UPDATE products SET ${sets.join(
    ", "
  )}, updated_at = now() WHERE id = $${idx} RETURNING *`;
  const res = await pool.query(sql, vals);
  return res.rows[0];
}

export async function deleteProduct(id: string) {
  const res = await pool.query(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [id]
  );
  return res.rows[0]; // returns deleted product row or undefined
}
