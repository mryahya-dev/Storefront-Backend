// src/middleware/roles.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(user.role))
      return res
        .status(403)
        .json({ error: "Forbidden: insufficient privileges" });
    next();
  };
}

export function requireOwnerOrAdmin(paramUserIdField = "user_id") {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user!;
    const targetId =
      (req.params as any).id ||
      (req.params as any).user_id ||
      (req.body as any).user_id;
    if (!targetId)
      return res.status(400).json({ error: "Missing target user id" });

    if (user.role === "admin" || user.userId === targetId) {
      return next();
    }

    return res.status(403).json({ error: "Forbidden: owner or admin only" });
  };
}
