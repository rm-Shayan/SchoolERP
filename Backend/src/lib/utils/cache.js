import redis from "../../config/redis.js";

// Thin cache-aside helpers around Redis. Every call is failure-safe: if Redis is
// down/unreachable the operation degrades to a no-op (cache miss) so the request
// still hits the DB and succeeds — caching never breaks a request.

export async function cacheGet(key) {
  try {
    const v = await redis.get(key);
    return v ? JSON.parse(v) : undefined;
  } catch {
    return undefined;
  }
}

export async function cacheSet(key, value, ttlSeconds = 30) {
  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {}
}

export async function cacheDel(key) {
  try {
    await redis.del(key);
  } catch {}
}

// Drop every key under a prefix. Per-tenant list caches hold few keys, so a
// single `keys` call is cheap; all errors are swallowed so an unavailable Redis
// degrades to "cache not invalidated" (slightly stale) rather than a failed request.
export async function cacheInvalidatePrefix(prefix) {
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(keys);
  } catch {}
}
