// src/routes/orders.ts
import express from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { parsePaging } from "../middleware/pagination";

const router = express.Router();

/**
 * POST /orders
 * Body: { items: [{ product_id, name, price, quantity }], status?: 'pending' }
 */
router.post(
  "/",
  requireAuth,
  requireRole(["customer", "admin"]),
  async (req: any, res) => {
    const client = await pool.connect();
    try {
      const userId = req.user.userId;
      const items = req.body.items;
      if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json({ error: "Items required" });

      // aggregate quantities per product_id
      const qtyMap = new Map<string, number>();
      for (const it of items) {
        if (!it.product_id || !it.quantity)
          return res
            .status(400)
            .json({ error: "Each item must have product_id and quantity" });
        const prev = qtyMap.get(it.product_id) ?? 0;
        qtyMap.set(it.product_id, prev + parseInt(it.quantity, 10));
      }

      await client.query("BEGIN");

      // Lock product rows and check availability
      for (const [productId, totalQty] of qtyMap.entries()) {
        const r = await client.query(
          "SELECT remaining_items FROM products WHERE id = $1 FOR UPDATE",
          [productId]
        );
        if (r.rowCount === 0) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ error: `Invalid product id ${productId}` });
        }
        const remaining = r.rows[0].remaining_items as number;
        if (remaining < totalQty) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ error: `Not enough stock for product ${productId}` });
        }
      }

      // Insert order — triggers compute line_total & decrement remaining_items
      const status = req.body.status || "pending";
      const insertRes = await client.query(
        `INSERT INTO orders (user_id, status, items) VALUES ($1, $2, $3) RETURNING *`,
        [userId, status, JSON.stringify(items)]
      );

      await client.query("COMMIT");

      return res.status(201).json(insertRes.rows[0]);
    } catch (err: any) {
      await client.query("ROLLBACK");
      console.error(err);
      if (err?.message) return res.status(400).json({ error: err.message });
      return res.status(500).json({ error: "Server error" });
    } finally {
      client.release();
    }
  }
);

// GET /api/orders?limit=&offset=  - admin sees all, customer sees their own
router.get("/", requireAuth, parsePaging(20, 100), async (req: any, res) => {
  try {
    const { limit, offset } = req.paging;
    if (req.user.role === "admin") {
      const r = await pool.query(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      );
      return res.json({ items: r.rows, limit, offset });
    } else {
      const r = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [req.user.userId, limit, offset]
      );
      return res.json({ items: r.rows, limit, offset });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
