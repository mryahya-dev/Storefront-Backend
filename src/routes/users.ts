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
// PUT /api/users/:id — update user details (admin can update any user, user can update own info)
router.put("/:id", requireAuth, async (req: any, res) => {
  const userId = req.params.id;

  try {
    // Check if current user is admin or updating own info
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: cannot update other users" });
    }

    // Only allow updating name, email, and password
    const updateData: any = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }
      updateData.password = req.body.password; // hash inside model
    }

    const updatedUser = await usersModel.updateUser(userId, updateData);

    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role, // returned but cannot be changed
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
