// src/utils/hash.ts
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const PEPPER = process.env.PEPPER || "";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password + PEPPER, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password + PEPPER, hash);
}
