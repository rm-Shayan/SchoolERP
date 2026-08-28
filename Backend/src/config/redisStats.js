/**
 * redisStats.js
 *
 * Collects connection status + Redis INFO stats from both clients:
 *   1. node-redis (redis.js)     — used for cache, school service, etc.
 *   2. ioredis  (redis.connection.js) — shared by all BullMQ workers/queues
 *
 * getRedisStats()  — instant, in-memory reads (used on every /health call)
 * getRedisInfo()   — runs INFO command, parses key sections (~1-2ms)
 */

import redis from "./redis.js";
import { redisConnection } from "../lib/redis.connection.js";

/** Return a snapshot of both Redis connections — zero network I/O. */
export const getRedisStats = () => {
  const nodeRedis = {
    connected: redis.isOpen,
    ready: redis.isReady,
  };

  const bullmqRedis = {
    status: redisConnection.status,
    commandQueueLength: redisConnection.commandQueueLength,
  };

  return { nodeRedis, bullmqRedis };
};

// ── Redis INFO parsing ────────────────────────────────────────────────────

/**
 * Parse a Redis INFO string into a flat object.
 * INFO returns sections like "# Server\nuptime_in_seconds:123\n...".
 * We extract only the fields we care about to keep the payload small.
 */
function parseInfo(raw) {
  const out = {};
  for (const line of raw.split("\r\n")) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    out[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return out;
}

/** Fields we extract from each INFO section. */
const FIELDS = {
  server: ["uptime_in_seconds", "tcp_port", "redis_mode"],
  clients: ["connected_clients", "blocked_clients", "tracking_clients"],
  memory: [
    "used_memory_human",
    "used_memory_peak_human",
    "mem_fragmentation_ratio",
    "maxmemory_human",
    "maxmemory_policy",
  ],
  stats: [
    "total_connections_received",
    "total_commands_processed",
    "instantaneous_ops_per_sec",
    "keyspace_hits",
    "keyspace_misses",
    "evicted_keys",
    "expired_keys",
  ],
};

/**
 * Run Redis INFO and return selected sections.
 * Uses ioredis (BullMQ connection) to avoid creating another connection.
 * Returns null if Redis is unreachable.
 */
export const getRedisInfo = async () => {
  if (redisConnection.status !== "ready") return null;

  try {
    const raw = await redisConnection.info("server", "clients", "memory", "stats");
    const all = parseInfo(raw);

    const result = {};
    for (const [section, keys] of Object.entries(FIELDS)) {
      result[section] = {};
      for (const key of keys) {
        result[section][key] = all[key] ?? null;
      }
    }

    // Compute hit rate
    const hits = parseInt(all.keyspace_hits || "0", 10);
    const misses = parseInt(all.keyspace_misses || "0", 10);
    result.stats.hit_rate = hits + misses > 0
      ? `${((hits / (hits + misses)) * 100).toFixed(1)}%`
      : "N/A";

    return result;
  } catch {
    return null;
  }
};
