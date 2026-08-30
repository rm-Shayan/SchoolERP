/**
 * General-purpose service-level request cache.
 *
 * Sits above the 2 s `requestCache` (axios-level dedup) and provides
 * longer-lived caching (configurable TTL) for stable reference data
 * like teaching assignments, timetables, staff lists, etc.
 *
 * Usage:
 *   import { cached, invalidate } from './serviceCache';
 *
 *   list: (schoolId) => cached(`assignments:${schoolId}`, 10_000, () =>
 *     api.get(...).then(r => r.data.data)
 *   ),
 *
 *   remove: async (id) => {
 *     await api.delete(...);
 *     invalidate('assignments:');
 *   }
 */

const DEFAULT_TTL = 10_000; // 10 s

interface CacheEntry {
  expires: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();

/**
 * Return cached value or execute `request`, cache the result, and return it.
 * Concurrent calls with the same key share one in-flight request.
 */
export async function cached<T>(
  key: string,
  ttlOrRequest: number | (() => Promise<T>),
  request?: () => Promise<T>,
): Promise<T> {
  const ttl = typeof ttlOrRequest === 'number' ? ttlOrRequest : DEFAULT_TTL;
  const fn = typeof ttlOrRequest === 'function' ? ttlOrRequest : request!;

  // 1. Cache hit
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  // 2. In-flight dedup
  const active = pending.get(key);
  if (active) return active as Promise<T>;

  // 3. New request
  const promise = fn()
    .then((value) => {
      cache.set(key, { value, expires: Date.now() + ttl });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}

/**
 * Invalidate all cache entries whose key starts with `prefix`.
 * Call this after any write (create / update / delete) that affects
 * the cached dataset.
 */
export function invalidate(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/** Clear the entire cache (e.g. on logout). */
export function clearServiceCache() {
  cache.clear();
  pending.clear();
}
