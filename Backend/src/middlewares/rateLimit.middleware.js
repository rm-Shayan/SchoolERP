import { rateLimit } from "express-rate-limit";

// ==========================================
// RATE LIMITING — brute-force / abuse protection
// ==========================================
//
// Security hardening for the auth & OTP surface (staff login, parent/student
// OTP request & verify). Each limiter uses the in-memory store by default —
// swap in a Redis-backed store in production clusters (see src/config/redis.js).

const baseConfig = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests. Please try again later.",
  },
};

/**
 * Staff login: email + password brute-force guard.
 * 20 attempts per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

/**
 * OTP request/verify (parent & student portal): 6-digit codes are low-entropy,
 * so keep the attempt budget tight to prevent guessing.
 * 10 requests per 15 minutes per IP.
 */
export const otpLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

/**
 * Password reset / token refresh — generic sensitive-route limiter.
 * 30 requests per 15 minutes per IP.
 */
export const sensitiveLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 30,
});

/**
 * Global API guard — applied server-wide as a final safety net.
 * 300 requests per minute per IP.
 */
export const globalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 1000,
  limit: 300,
  skip: (req) => req.ip === "::1" || req.ip === "127.0.0.1" || req.ip === "::ffff:127.0.0.1",
});
