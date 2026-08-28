import api from './client';
import type {
  ApiResponse,
  NotificationDeliveryStatus,
  NotificationLogsResponse,
} from '@/types';

export interface PortalNotification {
  id: string;
  organizationId?: string | null;
  schoolId?: string | null;
  senderId?: string | null;
  senderName: string;
  recipientId?: string | null;
  title: string;
  body: string;
  category: string;
  refType?: string | null;
  refId?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PortalNotificationsResponse {
  items: PortalNotification[];
  total: number;
  page: number;
  pageSize: number;
}

export const notificationService = {
  // ── Email delivery logs (existing) ──
  getLogs: async (params?: {
    schoolId?: string;
    channel?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<NotificationLogsResponse> => {
    const res = await api.get<ApiResponse<NotificationLogsResponse>>('/notifications/logs', { params });
    return res.data.data;
  },

  getDeliveryStatus: async (params?: { schoolId?: string }): Promise<NotificationDeliveryStatus> => {
    const res = await api.get<ApiResponse<NotificationDeliveryStatus>>('/notifications/status', { params });
    return res.data.data;
  },

  // ── Portal (in-app) notifications ──
  getPortal: async (params?: {
    schoolId?: string;
    organizationId?: string;
    category?: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PortalNotificationsResponse> => {
    const res = await api.get<ApiResponse<PortalNotificationsResponse>>('/notifications/portal', { params });
    return res.data.data;
  },

  getUnreadCount: async (schoolId?: string, organizationId?: string): Promise<number> => {
    const res = await api.get<ApiResponse<{ count: number }>>('/notifications/portal/unread-count', { params: { schoolId, organizationId } });
    return res.data.data.count;
  },

  markRead: async (ids: string[]): Promise<{ updated: number }> => {
    const res = await api.post<ApiResponse<{ updated: number }>>('/notifications/portal/mark-read', { ids });
    return res.data.data;
  },

  markAllRead: async (schoolId?: string): Promise<{ updated: number }> => {
    const res = await api.post<ApiResponse<{ updated: number }>>('/notifications/portal/mark-all-read', {}, { params: { schoolId } });
    return res.data.data;
  },

  remove: async (ids: string[]): Promise<{ deleted: number }> => {
    const res = await api.post<ApiResponse<{ deleted: number }>>('/notifications/portal/delete', { ids });
    return res.data.data;
  },

  // ── Super Admin: send notification to org admin ──
  sendFromSuperAdmin: async (data: {
    organizationId?: string;
    schoolId?: string;
    recipientId?: string;
    title: string;
    body: string;
    category?: string;
  }): Promise<PortalNotification> => {
    const res = await api.post<ApiResponse<PortalNotification>>('/notifications/portal/send', data);
    return res.data.data;
  },
};
