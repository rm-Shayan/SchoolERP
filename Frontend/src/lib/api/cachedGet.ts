import api from './client';
import type { ApiResponse } from '@/types';

/**
 * Tiny in-memory GET cache for shared/common dropdown data (academic years,
 * classes, sections, subjects, templates). Data jo rarely change — pages ke
 * har mount par dobara fetch na karne ke liye.
 *
 * Mutations (create/update/delete) `invalidateApiCache()` se cache ko clear
 * karte hain, is liye stale naye data ke saath overwrite hota hai.
 */

interface CacheEntry {
  until: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

const key = (method: string, url: string, params?: unknown) =>
  `${method}|${url}|${params ? JSON.stringify(params) : ''}`;

export function cachedGet<T>(
  url: string,
  params?: Record<string, unknown>,
  ttlMs = 600_000,
  force = false,
): Promise<T> {
  const k = key('GET', url, params);
  const hit = cache.get(k);
  if (!force && hit && hit.until > Date.now()) {
    return Promise.resolve(hit.data as T);
  }

  const pending = inflight.get(k);
  if (pending) return pending as Promise<T>;

  const req = api
    .get<ApiResponse<T>>(url, { params })
    .then((res) => {
      cache.set(k, { until: Date.now() + ttlMs, data: res.data.data });
      return res.data.data;
    })
    .finally(() => inflight.delete(k));

  inflight.set(k, req);
  return req;
}

export function invalidateApiCache(urlPrefix?: string) {
  if (!urlPrefix) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) {
    if (k.includes(urlPrefix)) cache.delete(k);
  }
}