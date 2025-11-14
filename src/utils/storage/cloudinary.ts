// src/utils/storage/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import streamifier from "streamifier";

dotenv.config();

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_FOLDER,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // In production you'd want to fail fast; for tests you may mock these functions.
  // throw new Error("Cloudinary config not set");
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadResult = { public_id: string; url: string };

/**
 * Upload a buffer to Cloudinary using upload_stream.
 * folder is optional and derived from CLOUDINARY_UPLOAD_FOLDER if set.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  originalName = "file"
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const folder = CLOUDINARY_UPLOAD_FOLDER
      ? `${CLOUDINARY_UPLOAD_FOLDER}`
      : undefined;
    const opts: any = {
      resource_type: "image",
      folder,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      opts,
      (error: any, result: any) => {
        if (error) return reject(error);
        if (!result)
          return reject(new Error("No result from cloudinary upload"));
        resolve({
          public_id: result.public_id,
          url: result.secure_url || result.url,
        });
      }
    );

    // Convert buffer into stream and pipe to cloudinary
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/** Deletes a Cloudinary asset by public_id */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!publicId) return;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: "image" },
      (err: any, result: any) => {
        if (err) return reject(err);
        // result: { result: 'ok' } or { result: 'not found' }
        resolve();
      }
    );
  });
}
