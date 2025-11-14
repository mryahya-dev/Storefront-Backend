import { authCookieOptions } from "../config/cookie";

// src/routes/auth.ts
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { hashPassword, comparePassword } from "../utils/hash";
import { createUser, getUserByEmail } from "../models/users.model";

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });
    if (typeof password !== "string" || password.length < 8)
      return res.status(400).json({ error: "Password must be >= 8 chars" });

    const existing = await getUserByEmail(email);
    if (existing)
      return res.status(409).json({ error: "Email already in use" });

    const hashed = await hashPassword(password);
    const user = await createUser(name, email, hashed); // returns user object with id & role

    // create token (short-lived)
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "8h",
    });

    // set httpOnly cookie
    res.cookie("token", token, authCookieOptions);
    // optionally also return user info (not token)
    return res
      .status(201)
      .json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "8h",
    });

    // set the cookie (HttpOnly)
    res.cookie("token", token, authCookieOptions);

    return res.json({ message: "Authenticated", id: user.id, role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
