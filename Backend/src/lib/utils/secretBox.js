import crypto from "crypto";

// ── AES-256-GCM encryption for tenant SMTP passwords at rest ──
// Key MAIL_ENC_KEY env se aati hai (32-byte hex). Missing ho to JWT_SECRET
// se derive ho jati hai (dev-friendly) + warning log — production mein
// MAIL_ENC_KEY set karna zaroori hai, warna key rotation ka koi control nahi.
let cachedKey = null;
function getKey() {
  if (cachedKey) return cachedKey;
  const secret = process.env.MAIL_ENC_KEY || process.env.JWT_SECRET || "school-erp-dev-only";
  if (!process.env.MAIL_ENC_KEY) {
    console.warn(
      "[crypto] MAIL_ENC_KEY not set — deriving from fallback. Set a 64-char hex key in .env for production."
    );
  }
  cachedKey = crypto.createHash("sha256").update(String(secret)).digest();
  return cachedKey;
}

/** Encrypt a secret → "iv.tag.ciphertext" (all base64). */
export function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64")).join(".");
}

/**
 * Decrypt an encrypted payload back to plain text.
 * Returns null on tamper/failure — callers must treat null as "creds broken".
 */
export function decryptSecret(payload) {
  try {
    const [ivB64, tagB64, dataB64] = String(payload).split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
