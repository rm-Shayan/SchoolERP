'use client';
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse } from '@/types';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});


let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  // Never persist missing values as the literal string "undefined". This can
  // make guards think a session exists while refresh immediately fails.
  accessToken = typeof access === 'string' && access.trim() ? access : null;
  refreshToken = typeof refresh === 'string' && refresh.trim() ? refresh : null;
  if (typeof window !== 'undefined') {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    else localStorage.removeItem('refreshToken');
  }
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  if (!accessToken) {
    const stored = localStorage.getItem('accessToken');
    accessToken = stored && stored !== 'undefined' && stored !== 'null' ? stored : null;
  }
  return accessToken;
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  if (!refreshToken) {
    const stored = localStorage.getItem('refreshToken');
    refreshToken = stored && stored !== 'undefined' && stored !== 'null' ? stored : null;
  }
  return refreshToken;
}

export function clearAuth() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    localStorage.removeItem('school');
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    config.headers.delete('Content-Type');
  }
  return config;
});

function normalizeErrorMessage(error: AxiosError) {
  const data = error.response?.data as { message?: unknown } | undefined;
  const msg = data?.message;
  if (typeof msg === 'string' && msg.trim() !== '') {
    error.message = msg;
  }
  return error;
}

// Single-flight guard: concurrent 401s share ONE refresh call. Without this,
// each failing request fires its own /auth/refresh; the first one ROTATES and
// revokes the old refresh token, so the next one fails → instant logout.
let refreshPromise: Promise<AuthResponse> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = originalRequest?.url ?? '';

    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;
      const storedRefresh = getRefreshToken();

      if (storedRefresh) {
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post<ApiResponse<AuthResponse>>(`${API_BASE_URL}/auth/refresh`, {
                refreshToken: storedRefresh,
              })
              .then((r) => r.data.data);
          }
          const data = await refreshPromise;
          setTokens(data.accessToken, data.refreshToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Reset so a later request can attempt a fresh refresh
          refreshPromise = null;
          // Only wipe the session on a GENUINE auth rejection (4xx). A transient
          // network error or 5xx (backend briefly unreachable during dev) must NOT
          // log the user out — keep tokens so they survive a flaky backend.
          const status = (refreshError as AxiosError)?.response?.status;
          if (status && status >= 400 && status < 500) {
            clearAuth();
            if (typeof window !== 'undefined') window.location.href = '/login';
          }
          return Promise.reject(error);
        } finally {
          refreshPromise = null;
        }
      } else if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        clearAuth();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(normalizeErrorMessage(error));
  }
);

export default api;
