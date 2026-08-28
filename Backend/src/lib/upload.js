import multer from "multer";

/**
 * Shared multer setups — memory storage + configurable size caps.
 * Har module apni copy na kare; yahan se import karo.
 */

const mbToBytes = (envVar, fallbackMb) => {
  const mb = Number.parseInt(process.env[envVar] || String(fallbackMb), 10);
  return (Number.isFinite(mb) ? mb : fallbackMb) * 1024 * 1024;
};

export const MAX_IMAGE_UPLOAD_BYTES = mbToBytes("MAX_IMAGE_UPLOAD_SIZE_MB", 5);
// Excel imports are NOT images — keep their own (larger) cap so the strict
// image limit doesn't reject big bulk-import files.
export const MAX_FILE_UPLOAD_BYTES = mbToBytes("MAX_FILE_UPLOAD_SIZE_MB", 10);

const makeUpload = (maxBytes) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes },
  });

/** Logos/avatars ke liye. */
export const imageUpload = makeUpload(MAX_IMAGE_UPLOAD_BYTES);

/** Excel bulk-import files ke liye. */
export const fileUpload = makeUpload(MAX_FILE_UPLOAD_BYTES);
