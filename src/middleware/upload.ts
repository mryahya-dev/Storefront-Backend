// src/middleware/upload.ts
import multer from "multer";
import dotenv from "dotenv";
import { Request } from "express";
dotenv.config();

const MAX_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || "5242880", 10); // 5MB default

const storage = multer.memoryStorage();

function fileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});
