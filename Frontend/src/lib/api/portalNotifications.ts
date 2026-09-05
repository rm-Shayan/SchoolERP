'use client';

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';
import type { PortalNotification } from './notificationService';
import { portalLoginRedirect } from '@/lib/utils/orgTheme';

const API = '/api/v1';

// Memoized axios instances — one per token key, reused across calls.
const instances = new Map<string, ReturnType<typeof axios.create>>();

function createPortalAxios(tokenKey: string) {
  const instance = axios.create({ baseURL: API });
  instance.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    const t = localStorage.getItem(tokenKey);
    if (t && cfg.headers) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });
  instance.interceptors.response.use(
    (r) => r,
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(tokenKey === 'parentToken' ? 'parentProfile' : 'studentProfile');
        window.location.href = portalLoginRedirect();
      }
      return Promise.reject(err);
    },
  );
  return instance;
}

function getAxios() {
  if (typeof window === 'undefined') return createPortalAxios('parentToken');
  const key = localStorage.getItem('studentToken') ? 'studentToken' : 'parentToken';
  let instance = instances.get(key);
  if (!instance) { instance = createPortalAxios(key); instances.set(key, instance); }
  return instance;
}

/** Portal-scoped notification methods using parentToken/studentToken auth. */
export const portalNotificationService = {
  async getNotifications(params?: { unreadOnly?: boolean; pageSize?: number }): Promise<{ items: PortalNotification[]; total: number }> {
    const res = await getAxios().get<ApiResponse<{ items: PortalNotification[]; total: number }>>('/notifications/portal', { params });
    return res.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await getAxios().get<ApiResponse<{ count: number }>>('/notifications/portal/unread-count');
    return res.data.data.count;
  },

  async markRead(ids: string[]): Promise<void> {
    await getAxios().post('/notifications/portal/mark-read', { ids });
  },

  async markAllRead(): Promise<void> {
    await getAxios().post('/notifications/portal/mark-all-read');
  },

  async remove(ids: string[]): Promise<void> {
    await getAxios().post('/notifications/portal/delete', { ids });
  },
};
