'use client';

import { api } from './api';
import type { PortalNotification, PortalNotificationsResponse } from '@/lib/api/notificationService';
import type { ApiResponse } from '@/types';

export type { PortalNotification, PortalNotificationsResponse };

const notificationEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    portalNotifications: build.query<PortalNotificationsResponse, Record<string, unknown>>({
      query: (params) => ({ url: '/notifications/portal', params: Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) }),
      transformResponse: (res: ApiResponse<PortalNotificationsResponse>) => res.data,
      providesTags: (result) =>
        result ? [...result.items.map((n) => ({ type: 'Notification' as const, id: n.id })), 'Notification'] : ['Notification'],
    }),
    unreadCount: build.query<number, Record<string, unknown>>({
      query: (params) => ({ url: '/notifications/portal/unread-count', params: Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) }),
      transformResponse: (res: ApiResponse<{ count: number }>) => res.data.count,
      providesTags: ['Notification'],
    }),
    markRead: build.mutation<{ updated: number }, string[]>({
      query: (ids) => ({ url: '/notifications/portal/mark-read', method: 'POST', body: { ids } }),
      transformResponse: (res: ApiResponse<{ updated: number }>) => res.data,
      invalidatesTags: ['Notification'],
    }),
    markAllRead: build.mutation<{ updated: number }, string | undefined>({
      query: (schoolId) => ({
        url: '/notifications/portal/mark-all-read',
        method: 'POST',
        body: {},
        params: schoolId ? { schoolId } : undefined,
      }),
      transformResponse: (res: ApiResponse<{ updated: number }>) => res.data,
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: build.mutation<{ deleted: number }, string[]>({
      query: (ids) => ({ url: '/notifications/portal/delete', method: 'POST', body: { ids } }),
      transformResponse: (res: ApiResponse<{ deleted: number }>) => res.data,
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  usePortalNotificationsQuery,
  useUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} = notificationEndpoints;
