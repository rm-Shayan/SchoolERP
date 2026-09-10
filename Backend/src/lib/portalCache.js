/**
 * Lightweight in-memory response cache for portal endpoints.
 * 30s TTL, max 500 entries. Avoids Redis overhead for hot read paths.
 * Keys are scoped by portal type + id + endpoint to prevent cross-user leaks.
 */

const cache = new Map();
const DEFAULT_TTL = 30_000; // 30 seconds
const MAX_ENTRIES = 500;

export function getCachedPortal(portalKey, endpoint) {
  const key = `${portalKey}:${endpoint}`;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedPortal(portalKey, endpoint, data, ttl = DEFAULT_TTL) {
  if (cache.size >= MAX_ENTRIES) {
    // Evict oldest entry
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  const key = `${portalKey}:${endpoint}`;
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

/** Bust cache when data changes (e.g., after POST/PATCH/DELETE). */
export function bustPortalCache(portalKey) {
  for (const key of cache.keys()) {
    if (key.startsWith(portalKey + ":")) cache.delete(key);
  }
}
