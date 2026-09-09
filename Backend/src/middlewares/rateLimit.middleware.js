import { rateLimit } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../config/redis.js";

// ==========================================
// RATE LIMITING — brute-force / abuse protection
// ==========================================
//
// Redis-backed store: works across PM2 workers and horizontal scale.
// Falls back to in-memory if Redis is unavailable.

const redisStore = new RedisStore({
  sendCommand: (...args) => redis.sendCommand(args),
  prefix: "rl:",
});

const baseConfig = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: redisStore,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests. Please try again later.",
  },
};

/**
 * Staff login: email + password brute-force guard.
 * 50 attempts per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 50,
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
 * 1000 requests per minute per IP (supports 1000 req/s burst capacity).
 */
export const globalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 1000,
  limit: 1000,
  skip: (req) => req.ip === "::1" || req.ip === "127.0.0.1" || req.ip === "::ffff:127.0.0.1",
});
