// src/routes/products.ts
import express from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import * as productsModel from "../models/products.model";
import { parsePaging } from "../middleware/pagination";
import { upload } from "../middleware/upload";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/storage/cloudinary";

const router = express.Router();

// DELETE /api/products/:id
// Admin-only. Deletes DB row then removes Cloudinary asset (if any).
router.delete(
  "/:id",
  requireAuth,
  requireRole(["admin"]),
  async (req: any, res) => {
    const productId = req.params.id;
    try {
      // fetch product to know public_id
      const existing = await productsModel.getProductById(productId);
      if (!existing)
        return res.status(404).json({ error: "Product not found" });

      // delete DB row (returns deleted row)
      const deleted = await productsModel.deleteProduct(productId);
      if (!deleted)
        return res.status(500).json({ error: "Failed to delete product" });

      // delete Cloudinary asset if present
      if (deleted.image_public_id) {
        try {
          await deleteFromCloudinary(deleted.image_public_id);
        } catch (delErr) {
          // log failure but product is already deleted from DB
          console.error(
            "Failed to delete Cloudinary asset for deleted product",
            delErr
          );
        }
      }

      return res.status(204).send();
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

// Public list with pagination
router.get("/", parsePaging(20, 100), async (req, res) => {
  try {
    const { limit, offset } = (req as any).paging;
    const prods = await productsModel.listProducts({ limit, offset });
    res.json({ items: prods, limit, offset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const p = await productsModel.getProductById(req.params.id);
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// inside router file - admin only create (multipart/form-data)
router.post(
  "/",
  requireAuth,
  requireRole(["admin"]),
  upload.single("image"),
  async (req: any, res) => {
    let publicId: string | null = null;
    try {
      const body = req.body;

      if (!body.name || body.price == null) {
        return res.status(400).json({ error: "name and price required" });
      }

      // upload to Cloudinary if file present
      if (req.file) {
        const file = req.file as Express.Multer.File;
        // Basic extra validation - ensure buffer present
        if (!file.buffer)
          return res.status(400).json({ error: "Invalid file" });

        const uploadRes = await uploadToCloudinary(
          file.buffer,
          file.originalname
        );
        publicId = uploadRes.public_id;
        body.image_url = uploadRes.url;
        body.image_public_id = uploadRes.public_id;
      }

      // ensure numbers are parsed
      body.quantity = parseInt(body.quantity ?? "0", 10);
      body.remaining_items = parseInt(
        body.remaining_items ?? String(body.quantity || 0),
        10
      );

      const product = await productsModel.createProduct(body);
      return res.status(201).json(product);
    } catch (err: any) {
      // If upload succeeded but DB insert failed, try to remove the uploaded Cloudinary asset
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (delErr) {
          console.error("Failed to delete orphan cloudinary asset", delErr);
        }
      }

      console.error(err);
      // handle multer / cloudinary errors
      return res.status(500).json({ error: err?.message || "Server error" });
    }
  }
);

// PUT /api/products/:id — admin only, image upload optional
router.put(
  "/:id",
  requireAuth,
  requireRole(["admin"]),
  upload.single("image"), // allows 0 or 1 file
  async (req: any, res) => {
    const productId = req.params.id;
    let newPublicId: string | null = null;

    try {
      // Fetch existing product
      const existing = await productsModel.getProductById(productId);
      if (!existing)
        return res.status(404).json({ error: "Product not found" });

      // Only handle image if a file was uploaded
      if (req.file && req.file.buffer) {
        const uploadRes = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );
        newPublicId = uploadRes.public_id;
        req.body.image_url = uploadRes.url;
        req.body.image_public_id = uploadRes.public_id;
      }

      // Normalize numeric fields if present
      if (req.body.quantity !== undefined)
        req.body.quantity = parseInt(String(req.body.quantity), 10) || 0;
      if (req.body.remaining_items !== undefined)
        req.body.remaining_items =
          parseInt(String(req.body.remaining_items), 10) || 0;
      if (req.body.price !== undefined)
        req.body.price = parseFloat(String(req.body.price));

      // Update product in DB
      const updated = await productsModel.updateProduct(productId, req.body);

      // Delete old Cloudinary image if a new one was uploaded
      if (
        newPublicId &&
        existing.image_public_id &&
        existing.image_public_id !== newPublicId
      ) {
        try {
          await deleteFromCloudinary(existing.image_public_id);
        } catch (err) {
          console.error("Failed to delete old Cloudinary image", err);
        }
      }

      return res.json(updated);
    } catch (err: any) {
      // If DB update fails but we uploaded a new image, delete the newly uploaded asset
      if (newPublicId) {
        try {
          await deleteFromCloudinary(newPublicId);
        } catch (delErr) {
          console.error(
            "Failed to delete newly uploaded Cloudinary asset after update failure",
            delErr
          );
        }
      }
      console.error(err);
      return res.status(500).json({ error: err?.message || "Server error" });
    }
  }
);

export default router;
