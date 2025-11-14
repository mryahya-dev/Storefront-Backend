// src/routes/users.ts
import express from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { parsePaging } from "../middleware/pagination";
import * as usersModel from "../models/users.model";

const router = express.Router();

// GET /api/users?limit=20&offset=0  (admin only)
router.get(
  "/",
  requireAuth,
  requireRole(["admin"]),
  parsePaging(20, 100),
  async (req, res) => {
    try {
      const { limit, offset } = (req as any).paging;
      const rows = await usersModel.listUsers({ limit, offset });
      res.json({ items: rows, limit, offset });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/users/:id (admin or owner)
router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const requester = req.user;
    if (requester?.role !== "admin" && requester?.userId !== req.params.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const user = await usersModel.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/users/:id/role (admin)
router.put(
  "/:id/role",
  requireAuth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { role } = req.body;
      if (!role || !["customer", "admin"].includes(role))
        return res.status(400).json({ error: "Invalid role" });
      const updated = await usersModel.updateUserRole(req.params.id, role);
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
