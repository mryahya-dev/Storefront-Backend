// src/models/users.model.ts
import { pool } from "../db";
import bcrypt from "bcrypt";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return res.rows[0] || null;
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  role = "customer"
) {
  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, passwordHash, role]
  );
  return res.rows[0];
}

export async function listUsers(opts?: { limit?: number; offset?: number }) {
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const res = await pool.query(
    "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );
  return res.rows;
}

export async function getUserById(id: string) {
  const res = await pool.query(
    "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1",
    [id]
  );
  return res.rows[0];
}

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");
const PEPPER = process.env.PEPPER || "";

interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
}

export const updateUser = async (userId: string, data: UpdateUserData) => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.name) {
    fields.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.email) {
    fields.push(`email = $${idx++}`);
    values.push(data.email);
  }
  if (data.password) {
    const hashed = await bcrypt.hash(
      data.password + PEPPER,
      BCRYPT_SALT_ROUNDS
    );
    fields.push(`password = $${idx++}`);
    values.push(hashed);
  }

  if (fields.length === 0) {
    throw new Error("No valid fields to update");
  }

  const query = `
    UPDATE users
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING id, name, email, role
  `;
  values.push(userId);

  const { rows } = await pool.query(query, values);
  if (rows.length === 0) {
    throw new Error("User not found");
  }

  return rows[0];
};
