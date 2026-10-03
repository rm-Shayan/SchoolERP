import crypto from "crypto";
import { getEncryptionSecret } from "../../config/secrets.js";

// ── AES-256-GCM encryption for tenant SMTP passwords at rest ──
// Key MAIL_ENC_KEY env se aati hai (32-byte hex). Production me missing ho to
// startup par fail hota hai (C2) — warna public fallback key se data decrypt
// ho sakta tha. Local/dev me fallback allowed hai.
let cachedKey = null;
function getKey() {
  if (cachedKey) return cachedKey;
  const secret = getEncryptionSecret();
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
  return encryptSecretWith(plain, getKey());
}

/**
 * Decrypt an encrypted payload back to plain text.
 * Returns null on tamper/failure — callers must treat null as "creds broken".
 */
export function decryptSecret(payload) {
  return decryptSecretWith(payload, getKey());
}

// ── Explicit-key variants ──────────────────────────────────────────────
// Rotation scripts (scripts/rotateSmtpEncryptionKey.js) ko ek key se decrypt
// karke DOOSRI key se encrypt karna hota hai, jabki process.env me abhi
// purani key lagi hui hai. Isliye key ko argument me lene wala core yahan
// hai aur upar wale wrappers ambient key use karte hain.

/** Encrypt with an explicit 32-byte key. */
export function encryptSecretWith(plain, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64")).join(".");
}

/** Decrypt with an explicit 32-byte key. Returns null on any failure. */
export function decryptSecretWith(payload, key) {
  try {
    const [ivB64, tagB64, dataB64] = String(payload).split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
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

/** The raw 32-byte key derived from a secret string (sha256). */
export function deriveKey(secret) {
  return crypto.createHash("sha256").update(String(secret)).digest();
}

/** The secret currently backing the at-rest encryption (for rotation tools). */
export function currentSecret() {
  return getEncryptionSecret();
}

