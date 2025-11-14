// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export type JwtPayloadType = { userId: string; role: string };

export interface AuthRequest extends Request {
  user?: JwtPayloadType;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // 1) Prefer cookie
    const tokenFromCookie = req.cookies?.token;
    // 2) Fallback to Bearer Authorization header (optional)
    const authHeader = req.headers.authorization;
    const tokenFromHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;
    const token = tokenFromCookie || tokenFromHeader;
    if (!token) return res.status(401).json({ error: "Missing token" });

    // quick sanity check on length
    if (token.length < 20 || token.length > 2000)
      return res.status(401).json({ error: "Invalid token" });

    // quick token length validation
    if (token.length < 20 || token.length > 2000) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const secret = process.env.JWT_SECRET as string;
    if (!secret)
      return res.status(500).json({ error: "JWT secret not configured" });

    const payload = jwt.verify(token, secret) as JwtPayloadType;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
