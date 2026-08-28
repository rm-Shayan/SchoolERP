import crypto from "crypto";

/**
 * Generic student identifier (QR value today, RFID tag ID in the future).
 * PRD: system stores this in `Student.identifierCode`; when RFID hardware
 * arrives, the same field holds the RFID tag ID — no schema change needed.
 */
export const generateIdentifierCode = () =>
  `ID-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

/**
 * Build a human-friendly identifier derived from school code + roll number.
 * Used when the school wants a deterministic code (re-printable, memorable).
 */
export const identifierFromRoll = (schoolCode, rollNumber) => {
  const code = String(schoolCode || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const roll = String(rollNumber || "").trim().toUpperCase();
  return `${code}-${roll}`.replace(/-+/g, "-");
};
