'use client';
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse } from '@/types';


const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = typeof access === 'string' && access.trim() ? access : null;
  refreshToken = typeof refresh === 'string' && refresh.trim() ? refresh : null;
  if (typeof window !== 'undefined') {
    if (accessToken) localStorage.setItem('accessToken', accessToken); else localStorage.removeItem('accessToken');
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken); else localStorage.removeItem('refreshToken');
  }
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  if (!accessToken) { const s = localStorage.getItem('accessToken'); accessToken = s && s !== 'undefined' && s !== 'null' ? s : null; }
  return accessToken;
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  if (!refreshToken) { const s = localStorage.getItem('refreshToken'); refreshToken = s && s !== 'undefined' && s !== 'null' ? s : null; }
  return refreshToken;
}

export function clearAuth() {
  accessToken = null; refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); localStorage.removeItem('organization'); localStorage.removeItem('school');
  }
}

// ─── Request interceptor ───────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData && config.headers) config.headers.delete('Content-Type');
  return config;
});

// ─── Refresh queue (single-flight + waiting queue) ─────────────────
let refreshPromise: Promise<AuthResponse> | null = null;
let refreshQueue: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];
const waitForRefresh = () => new Promise<void>((resolve, reject) => { refreshQueue.push({ resolve, reject }); });
function flushRefreshQueue(error?: unknown) {
  const q = refreshQueue; refreshQueue = [];
  q.forEach((e) => (error ? e.reject(error) : e.resolve()));
}
function normalizeError(error: AxiosError) {
  const msg = (error.response?.data as { message?: unknown } | undefined)?.message;
  if (typeof msg === 'string' && msg.trim() !== '') error.message = msg;
  return error;
}

// ─── Response interceptor ──────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const req = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = req?.url ?? '';
    if (error.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh') && !req._retry) {
      req._retry = true;
      if (refreshPromise) {
        try { await waitForRefresh(); return api(req); }
        catch { return Promise.reject(normalizeError(error)); }
      }
      const storedRefresh = getRefreshToken();
      if (storedRefresh) {
        try {
          let schoolId: string | null = null;
          if (typeof window !== 'undefined') {
            try { schoolId = (JSON.parse(localStorage.getItem('user') || 'null') as any)?.schoolId || null; } catch {}
          }
          const body = schoolId ? { refreshToken: storedRefresh, schoolId } : { refreshToken: storedRefresh };
          refreshPromise = axios.post<ApiResponse<AuthResponse>>(`${API_BASE_URL}/auth/refresh`, body).then((r) => r.data.data);
          const data = await refreshPromise;
          setTokens(data.accessToken, data.refreshToken);
          flushRefreshQueue();
          refreshPromise = null;
          if (req.headers) req.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(req);
        } catch (e) {
          refreshPromise = null; flushRefreshQueue(e);
          const s = (e as AxiosError)?.response?.status;
          if (s && s >= 400 && s < 500) { clearAuth(); if (typeof window !== 'undefined') window.location.href = '/login'; }
          return Promise.reject(error);
        }
      } else if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        clearAuth(); if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(normalizeError(error));
  },
);

export default api;
