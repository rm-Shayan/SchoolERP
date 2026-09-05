'use client';

import { fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query';
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { getAccessToken, getRefreshToken, setTokens } from '@/lib/api';

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;

let refreshPromise: Promise<string> | null = null;

async function tryRefresh(): Promise<string> {
  const storedRefresh = getRefreshToken();
  if (!storedRefresh) throw new Error('No refresh token');
  let schoolId: string | null = null;
  try {
    schoolId = (JSON.parse(localStorage.getItem('user') || 'null') as any)?.schoolId ?? null;
  } catch { /* ignore */ }
  const body: Record<string, unknown> = { refreshToken: storedRefresh };
  if (schoolId) body.schoolId = schoolId;
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const json = await res.json();
  const data = json.data;
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const prepareHeaders = (headers: Headers) => {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  };
  const base = fetchBaseQuery({ baseUrl: API_BASE, prepareHeaders });
  let result = await base(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const url = typeof args === 'string' ? args : args.url;
    if (url.includes('/auth/login') || url.includes('/auth/refresh')) return result;
    try {
      if (!refreshPromise) refreshPromise = tryRefresh().finally(() => { refreshPromise = null; });
      const newToken = await refreshPromise;
      const retryBase = fetchBaseQuery({
        baseUrl: API_BASE,
        prepareHeaders: (h: Headers) => { h.set('Authorization', `Bearer ${newToken}`); return h; },
      });
      result = await retryBase(args, api, extraOptions);
    } catch {
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }
  return result;
};
