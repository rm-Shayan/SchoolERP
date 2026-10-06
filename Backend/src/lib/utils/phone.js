import ApiError from "./ApiError.js";

/**
 * PK phone normalization — WhatsApp ke liye zaroori.
 *
 * Aaj problem: `Parent.whatsappNo` raw input save hoti hai (`03001234567`,
 * `+923001234567`, `923001234567`, `0092...` sab alag-alag) jabki wo @unique
 * hai. Evolution API ko DIGITS-ONLY international format chahiye
 * (`923001234567`, `+` nahi) — warna message chupke se fail hoga.
 *
 * Isi liye: write par normalize karo, send par bhi ek baar aur.
 */

/** +, spaces, dashes, dots, brackets hata kar sirf digits nikaal deta hai. */
const digitsOf = (raw) => String(raw ?? "").replace(/\D+/g, "");

/** PK ke liye accepted prefixes, sabse zyada common se pehle. */
const PK_PREFIXES = ["0092", "+92", "92", "0"];

/** PK mobile numbers 11 digits hote hain 0 ke baad (03XXXXXXXXX). */
const PK_LOCAL_LENGTH = 11;

/**
 * normalizePkPhone("0300 123-4567") -> "923001234567"
 * normalizePkPhone("+923001234567") -> "923001234567"
 * normalizePkPhone("garbage")       -> null
 *
 * @returns {string|null} digits-only international number (no `+`), ya null
 */
export function normalizePkPhone(raw) {
  const digits = digitsOf(raw);
  if (!digits) return null;

  let local = digits;
  for (const prefix of PK_PREFIXES) {
    const p = digitsOf(prefix); // "+92" -> "92"
    if (p && local.startsWith(p)) {
      local = local.slice(p.length);
      break;
    }
  }

  // Leading zero PK local format me part hai — hata kar bahar wale me dobara jodte hain.
  if (local.startsWith("0")) local = local.slice(1);

  // Accept: 30xxxxxxxx (10 digits) ya 030xxxxxxx (11 digits).
  if (local.length !== PK_LOCAL_LENGTH && local.length !== PK_LOCAL_LENGTH - 1) return null;
  if (!/^3\d{9,10}$/.test(local)) return null;

  return `92${local}`;
}

/** Same validation, par normalized value wapas bhejta hai (throws nahi). */
export function normalizePkPhoneOrNull(raw) {
  return normalizePkPhone(raw);
}

/**
 * Form/input ke liye — invalid number par ApiError.
 * UI/validation me bhi same rule rakhna: `Frontend/src/lib/utils/validation.ts`.
 */
export function requirePkPhone(raw, label = "Phone number") {
  const normalized = normalizePkPhone(raw);
  if (!normalized) throw ApiError.badRequestError(`${label} must be a valid Pakistani mobile number`);
  return normalized;
}

/**
 * "Phone" argument ko normalize karta hai — legacy callers jinke paas
 * `03001234567` ya `+923001234567` dono aa sakte hain.
 *
 * @returns {string|null} normalized, ya null agar number valid hi nahi hai
 */
export function toNormalizedPhone(raw) {
  if (raw == null || raw === "") return null;
  return normalizePkPhone(raw);
}
