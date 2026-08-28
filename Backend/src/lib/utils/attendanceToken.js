import crypto from "crypto";

// ── Staff ID-card attendance QR tokens ──
// Token format: SAT1.<base64url(payload)>.<hmac-sha256(payload)>
// Payload: { sid (staffId), oid (organizationId|null), sch (schoolId|null) }
// No expiry by design — card is valid till "VALID TILL" date; forgery is
// blocked by the HMAC signature. Key MAIL_ENC_KEY (fallback JWT_SECRET).

const secret = () =>
  process.env.MAIL_ENC_KEY || process.env.JWT_SECRET || "school-erp-dev-only";

const hmac = (payload) =>
  crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

export function signAttendanceToken({ staffId, organizationId, schoolId }) {
  if (!staffId) throw new Error("staffId required for attendance token");
  const payload = Buffer.from(
    JSON.stringify({ sid: staffId, oid: organizationId || null, sch: schoolId || null })
  ).toString("base64url");
  return `SAT1.${payload}.${hmac(payload)}`;
}

/** Returns { staffId, organizationId, schoolId } or null when invalid/tampered. */
export function verifyAttendanceToken(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3 || parts[0] !== "SAT1") return null;
    const [, payload, sig] = parts;
    const expected = hmac(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.sid) return null;
    return { staffId: data.sid, organizationId: data.oid || null, schoolId: data.sch || null };
  } catch (_) {
    return null;
  }
}
