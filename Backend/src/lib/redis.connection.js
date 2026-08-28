/**
 * Centralized Redis connection for ALL BullMQ queues & workers.
 *
 * Shared ioredis instance — all Workers and Queues reuse this single
 * TCP connection instead of each creating their own (~12 → 1).
 *
 * Tuning knobs via env vars (safe defaults for Upstash / self-hosted):
 *   BULLMQ_CONNECT_TIMEOUT   — ms to wait for initial TCP+TLS handshake
 *   BULLMQ_COMMAND_TIMEOUT   — ms before a single COMMAND is considered hung
 *   BULLMQ_KEEPALIVE         — TCP keepalive interval in ms (0 = off)
 *   BULLMQ_MAX_RETRIES       — max reconnect attempts before giving up
 */

import IORedis from "ioredis";
import Logger from "./utils/logger.js";

const logger = new Logger("redis-bullmq");

// ── Env-tunable defaults ──────────────────────────────────────────────────
const CONNECT_TIMEOUT = parseInt(process.env.BULLMQ_CONNECT_TIMEOUT || "5000", 10);
const COMMAND_TIMEOUT = parseInt(process.env.BULLMQ_COMMAND_TIMEOUT || "30000", 10);
const KEEPALIVE_MS    = parseInt(process.env.BULLMQ_KEEPALIVE || "30000", 10);
const MAX_RETRIES     = parseInt(process.env.BULLMQ_MAX_RETRIES || "15", 10);

function buildConnection() {
  const url = process.env.REDIS_URL;
  const parsed = url ? new URL(url) : null;
  return {
    host: parsed ? parsed.hostname : "localhost",
    port: parsed ? parseInt(parsed.port || "6379", 10) : 6379,
    password: parsed?.password || undefined,
    tls: url?.startsWith("rediss://") ? {} : undefined,

    // ── BullMQ requirements ────────────────────────────────────────────
    maxRetriesPerRequest: null,       // BullMQ needs infinite retries

    // ── Connection lifecycle ───────────────────────────────────────────
    connectTimeout: CONNECT_TIMEOUT,  // fail fast on bad host / firewall
    lazyConnect: true,                // don't block module import
    enableReadyCheck: false,          // skip redundant PING on connect

    // ── Command safety ────────────────────────────────────────────────
    commandTimeout: COMMAND_TIMEOUT,  // kill hung commands (e.g. slow FLUSHALL)

    // ── Keepalive ─────────────────────────────────────────────────────
    // Sends TCP keepalive probes every KEEPALIVE_MS. Detects dead
    // connections (cloud LB idle timeout, firewall drop) before they
    // cause queued commands to hang.
    // First probe sent after 1s idle (tcpKeepAliveInitialDelay).
    keepAlive: KEEPALIVE_MS,
    tcpKeepAliveInitialDelay: 1000,

    // ── Reconnection ──────────────────────────────────────────────────
    retryStrategy(times) {
      if (times > MAX_RETRIES) {
        logger.logger.error(`BullMQ Redis: gave up after ${MAX_RETRIES} retries`);
        return null; // null = stop reconnecting, emit "end" event
      }
      // Exponential backoff: 200ms, 400ms, 800ms … capped at 5s
      const delay = Math.min(times * 200, 5000);
      logger.logger.info(`BullMQ Redis: reconnect attempt ${times} in ${delay}ms`);
      return delay;
    },

    // ── Pub/Sub resilience ─────────────────────────────────────────────
    // After reconnect, ioredis auto-resubscribes to all channels.
    // Critical for BullMQ's delayed job / event streams.
    enableAutoPipelining: true,       // batch commands when possible
    autoPipeliningIgnoredCommands: ["flushall", "flushdb"],
  };
}

// ── Create shared instance ──────────────────────────────────────────────
const connection = new IORedis(buildConnection());

connection.on("error", (err) => {
  logger.logger.error(`BullMQ Redis error: ${err.message}`);
});

connection.on("connect", () => {
  logger.logger.info("BullMQ Redis connected");
});

connection.on("reconnecting", (delay) => {
  logger.logger.info(`BullMQ Redis reconnecting in ${delay}ms`);
});

connection.on("ready", () => {
  logger.logger.info("BullMQ Redis ready — accepting commands");
});

connection.on("end", () => {
  logger.logger.warn("BullMQ Redis connection closed — will not reconnect");
});

// Force-connect now so it's ready by the time workers start.
connection.connect().catch((err) => {
  logger.logger.error(`BullMQ Redis connect failed: ${err.message}`);
});

export const redisConnection = connection;

/**
 * Factory: returns a NEW ioredis instance with the same config.
 * BullMQ Workers MUST use their own connection because they issue
 * blocking commands (BRPOPLPUSH) that lock the socket — sharing one
 * connection between N workers causes the other N-1 to hang and
 * trigger "Command timed out".
 */
export function createRedisConnection() {
  const config = buildConnection();
  // Workers issue blocking commands (XREADGROUP BLOCK / BRPOPLPUSH) that
  // are *supposed* to wait. ioredis commandTimeout kills them after N ms,
  // which is correct for non-blocking commands (Queue.add etc.) but
  // catastrophic for Workers — it causes "Command timed out" every cycle.
  delete config.commandTimeout;
  const conn = new IORedis(config);
  conn.on("error", (err) => {
    logger.logger.error(`BullMQ Redis error: ${err.message}`);
  });
  conn.connect().catch((err) => {
    logger.logger.error(`BullMQ Redis connect failed: ${err.message}`);
  });
  return conn;
}
