/**
 * Security-critical secret resolution.
 *
 * Production me koi bhi security secret missing ho to process fail karta hai —
 * public dev fallback par silently chalna token forgery (JWT) aur at-rest
 * decryption (encryption key) ko exploit-able bana deta tha (C2). Local/test me
 * dev fallback allowed hai taake setup frictionless rahe.
 */

const DEV_JWT_FALLBACK = "super_secret_school_erp_token";
const DEV_ENC_FALLBACK = "school-erp-dev-only";

const isProduction = () => process.env.NODE_ENV === "production";

/** JWT signing/verification secret. Production me required. */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isProduction()) {
    throw new Error(
      "JWT_SECRET is required in production — refusing to fall back to the public dev secret."
    );
  }
  return DEV_JWT_FALLBACK;
}

/**
 * Raw secret backing AES-256-GCM at-rest encryption. Production me
 * MAIL_ENC_KEY explicitly chahiye (JWT_SECRET fallback se key confusion hota).
 */
export function getEncryptionSecret() {
  const secret = process.env.MAIL_ENC_KEY;
  if (secret) return secret;
  if (isProduction()) {
    throw new Error(
      "MAIL_ENC_KEY is required in production — secret encryption cannot use a fallback key."
    );
  }
  return process.env.JWT_SECRET || DEV_ENC_FALLBACK;
}
