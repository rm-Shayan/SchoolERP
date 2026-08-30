// GET-request deduplication + short-lived response cache.
// Prevents duplicate HTTP calls when multiple components fire the same
// GET simultaneously (e.g. during token refresh or mount bursts).

import type { InternalAxiosRequestConfig } from 'axios';

const CACHE_TTL_MS = 2_000; // 2 s — dedup mount bursts, short enough to stay fresh

export const inflightRequests = new Map<string, Promise<unknown>>();
export const responseCache = new Map<string, { expires: number; data: unknown }>();

export function buildDedupeKey(config: InternalAxiosRequestConfig): string | null {
  if (config.method && config.method.toUpperCase() !== 'GET') return null;
  const params = config.params
    ? JSON.stringify(config.params, Object.keys(config.params).sort())
    : '';
  return `${config.url ?? ''}::${params}`;
}

/** Build a dedup key from a plain url + params pair (for the wrapper). */
export function buildKey(url: string, params?: Record<string, unknown>): string {
  const p = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${url}::${p}`;
}

export function cacheGet(key: string): unknown | undefined {
  const hit = responseCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;
  responseCache.delete(key);
  return undefined;
}

export function cacheSet(key: string, data: unknown) {
  responseCache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
}

export function inflightGet(key: string): Promise<unknown> | undefined {
  return inflightRequests.get(key);
}

export function inflightSet(key: string, promise: Promise<unknown>) {
  inflightRequests.set(key, promise);
}

export function inflightDelete(key: string) {
  inflightRequests.delete(key);
}

export function clearAll() {
  inflightRequests.clear();
  responseCache.clear();
}
