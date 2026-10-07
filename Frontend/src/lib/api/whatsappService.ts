import api from './client';
import type { ApiResponse } from '@/types';

export interface WhatsAppInstanceInfo {
  id: string;
  organizationId: string;
  schoolId: string;
  instanceName: string;
  integration: string;
  state: 'DISCONNECTED' | 'AWAITING_QR' | 'CONNECTED' | 'FAILED';
  phoneNumber: string | null;
  displayName: string | null;
  profilePicUrl: string | null;
  isEnabled: boolean;
  qrCode: string | null;
  qrExpiresAt: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
  updatedAt: string;
  schoolName?: string | null;
}

const target = (organizationId?: string | null, schoolId?: string | null) => {
  const params: Record<string, string> = {};
  if (organizationId) params.organizationId = organizationId;
  if (schoolId) params.schoolId = schoolId;
  return { params };
};

export const whatsappService = {
  getStatus: async (organizationId?: string | null, schoolId?: string | null): Promise<WhatsAppInstanceInfo | null> => {
    const res = await api.get<ApiResponse<WhatsAppInstanceInfo | null>>('/whatsapp/status', target(organizationId, schoolId));
    return res.data.data;
  },
  listByOrg: async (organizationId?: string | null): Promise<WhatsAppInstanceInfo[]> => {
    const res = await api.get<ApiResponse<WhatsAppInstanceInfo[]>>('/whatsapp/instances', target(organizationId, null));
    return res.data.data;
  },
  connect: async (organizationId?: string | null, schoolId?: string | null): Promise<WhatsAppInstanceInfo> => {
    const res = await api.post<ApiResponse<WhatsAppInstanceInfo>>('/whatsapp/connect', { organizationId, schoolId });
    return res.data.data;
  },
  refreshQr: async (organizationId?: string | null, schoolId?: string | null): Promise<WhatsAppInstanceInfo> => {
    const res = await api.post<ApiResponse<WhatsAppInstanceInfo>>('/whatsapp/refresh-qr', { organizationId, schoolId });
    return res.data.data;
  },
  sync: async (organizationId?: string | null, schoolId?: string | null): Promise<WhatsAppInstanceInfo | null> => {
    const res = await api.post<ApiResponse<WhatsAppInstanceInfo | null>>('/whatsapp/sync', { organizationId, schoolId });
    return res.data.data;
  },
  setEnabled: async (isEnabled: boolean, organizationId?: string | null, schoolId?: string | null): Promise<WhatsAppInstanceInfo> => {
    const res = await api.patch<ApiResponse<WhatsAppInstanceInfo>>('/whatsapp/enabled', { isEnabled, organizationId, schoolId });
    return res.data.data;
  },
  remove: async (organizationId?: string | null, schoolId?: string | null): Promise<void> => {
    await api.delete<ApiResponse<boolean>>('/whatsapp', target(organizationId, schoolId));
  },
};
