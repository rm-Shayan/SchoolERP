/**
 * Redis-backed response cache for portal endpoints.
 *
 * Cache-aside pattern: check Redis first, fall back to in-memory, then DB.
 * Keys are scoped by portal type + id + endpoint to prevent cross-user leaks.
 *
 * TTLs are set per-endpoint based on how frequently the data changes:
 * - overview: 2 min (changes on login, profile update, new records)
 * - attendance: 2 min (changes on every scan/override)
 * - fees: 5 min (changes on payment, overdue sweep)
 * - homework: 2 min (changes on new broadcast)
 * - circulars: 10 min (changes when new circular posted)
 * - results: 5 min (changes on new exam result)
 * - timetable: 10 min (changes at term start/end)
 * - conduct: 2 min (changes on new remark)
 * - ptm: 2 min (changes on new session)
 * - leave: 2 min (changes on new request)
 * - study-material: 5 min (changes on new upload)
 */

import redis from "../config/redis.js";

// --- Cache key patterns ---
const KEY_PREFIX = "portal";

/**
 * Generate a cache key for a portal endpoint.
 * @param {string} type - Portal type (parent|student)
 * @param {string} id - School/organization ID
 * @param {string} endpoint - Endpoint name (overview|attendance|fees|etc)
 * @param {string} [extra] - Extra key component (e.g., month,year for attendance)
 * @returns {string} - Redis key
 */
function makeKey(portalKey, endpoint, extra = "") {
  const base = `${KEY_PREFIX}:${portalKey}:${endpoint}`;
  return extra ? `${base}:${extra}` : base;
}

// --- TTL constants (in minutes) ---
const TTL = {
  overview: 2,      // 2 minutes — changes on login, profile update, new records
  attendance: 2,    // 2 minutes — changes on every scan/override
  fees: 5,          // 5 minutes — changes on payment, overdue sweep
  homework: 2,      // 2 minutes — changes on new broadcast
  circulars: 10,    // 10 minutes — changes when new circular posted (rare)
  results: 5,       // 5 minutes — changes on new exam result
  timetable: 10,    // 10 minutes — changes at term start/end
  conduct: 2,       // 2 minutes — changes on new remark
  ptm: 2,           // 2 minutes — changes on new session
  leave: 2,         // 2 minutes — changes on new request
  "study-material": 5, // 5 minutes — changes on new upload
};

/**
 * Fetch data from Redis cache. Returns null if not found or expired.
 */
async function redisGet(key) {
  try {
    const data = await redis.get(key);
    if (data === null) return null;
    return JSON.parse(data);
  } catch (_) {
    return null;
  }
}

/**
 * Store data in Redis cache with TTL.
 */
async function redisSet(key, data, ttlSeconds) {
  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch (_) {
    // Non-blocking — cache miss is acceptable
  }
}

/**
 * Get cached portal data using Redis (with in-memory fallback).
 * portalKey me child/scope bhi ho sakta hai (e.g. "parent:pid:studentId")
 * taake child switch par purani cache na mile.
 */
export async function getCachedPortal(portalKey, endpoint, extra = "") {
  const key = makeKey(portalKey, endpoint, extra);

  // 1. Try Redis first (primary, shared across instances)
  const cached = await redisGet(key);
  if (cached) return cached;

  // 2. Try in-memory fallback (commented out below) — Redis is the source.
  // 3. Return null → controller will fetch from DB and cache
  return null;
}

/**
 * Store data in both Redis and in-memory cache.
 * @param {string} portalKey - e.g., "parent:org123" or "student:stu456"
 * @param {string} endpoint - e.g., "overview", "fees", "attendance"
 * @param {any} data - Data to cache
 * @param {number} [ttlSeconds] - TTL in seconds (defaults to endpoint TTL)
 */
export async function setCachedPortal(portalKey, endpoint, data, ttlSeconds = null, extra = "") {
  const tKey = makeKey(portalKey, endpoint);

  // If a string is passed as the 4th arg it's an extra key component
  // (e.g., "att:12:2026") matching getCachedPortal's `extra` param.
  if (typeof ttlSeconds === "string") {
    extra = ttlSeconds;
    ttlSeconds = null;
  }

  // Determine TTL if not specified
  if (ttlSeconds === null) {
    const ttlMinutes = TTL[endpoint] || TTL.overview;
    ttlSeconds = ttlMinutes * 60;
  }

  const key = extra ? `${tKey}:${extra}` : tKey;

  // Store in Redis (primary, shared across instances)
  await redisSet(key, data, ttlSeconds);

  // In-memory cache can be updated too if needed, but Redis is the source of truth
  // The controller's existing in-memory Map can coexist for extra protection
}

/**
 * Bust cache when data changes.
 * @param {string} portalKey - e.g., "parent:org123" or "student:stu456"
 * @param {string} [endpoint] - Specific endpoint to bust, or all if omitted
 */
export async function bustPattern(portalKey) {
  // SCAN-based delete — scoped keys (portal:parent:pid:studentId:endpoint) ka
  // pattern pichle non-scoped busts se cover nahi hota. Best-effort cleanup.
  const pattern = `${KEY_PREFIX}:${portalKey}:*`;
  let cursor = "0";
  do {
    try {
      const { cursor: next, keys } = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = next;
      if (keys.length) await redis.del(keys);
    } catch {
      break;
    }
  } while (cursor !== "0");
}

export function bustPortalCache(portalKey, endpoint = null) {
  // portalKey format: "parent:orgId[:studentId]" — same key passed by controller.
  // Endpoint-specific bust me bhi SCAN pattern karo — overhead negligible, cover
  // non-scoped + scoped keys dono (conduct service like "parent:pid" hota hai).
  bustPattern(portalKey);

  if (endpoint) {
    // Bust specific endpoint
    const key = makeKey(portalKey, endpoint);
    redis.del(key).catch(() => {});
  } else {
    const endpoints = Object.keys(TTL);
    for (const ep of endpoints) {
      const key = makeKey(portalKey, ep);
      redis.del(key).catch(() => {});
    }
  }
}

/**
 * Invalidate portal cache when organization/school data changes.
 * Called from organization/service/school/service after create/update/delete.
 * @param {string} type - "parent" or "student"
 * @param {string} id - Organization ID or Student ID
 */
export function invalidatePortalCache(type, id) {
  const portalKey = `${type}:${id}`;
  bustPortalCache(portalKey);
}

// --- Export TTL constants for use in services/routes ---
export { TTL, makeKey };

// Export a convenience function for busting all portal caches for a given user
export function bustAllPortalCaches(type, id) {
  const portalKey = `${type}:${id}`;
  bustPattern(portalKey);
  const endpoints = Object.keys(TTL);
  for (const ep of endpoints) {
    const key = makeKey(portalKey, ep);
    redis.del(key).catch(() => {});
  }
}