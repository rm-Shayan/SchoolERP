import api from './client';
import type { ApiResponse, StorageSettingsStatus, StorageSettingsPayload } from '@/types';

/**
 * Per-tenant Cloudinary (media storage) credentials.
 * Backend: /api/v1/storage/settings — SUPER_ADMIN kisi bhi org ke liye,
 * ADMIN sirf apni org ke liye. Save se pehle backend real API ping karta hai.
 */
export const storageSettingsService = {
  getStatus: async (organizationId?: string | null, schoolId?: string | null): Promise<StorageSettingsStatus> => {
    const params: Record<string, string> = {};
    if (organizationId) params.organizationId = organizationId;
    if (schoolId) params.schoolId = schoolId;
    const res = await api.get<ApiResponse<StorageSettingsStatus>>('/storage/settings', { params });
    return res.data.data;
  },

  save: async (payload: StorageSettingsPayload): Promise<unknown> => {
    const res = await api.put<ApiResponse<unknown>>('/storage/settings', payload);
    return res.data.data;
  },

  remove: async (organizationId?: string | null, schoolId?: string | null): Promise<void> => {
    const params: Record<string, string> = {};
    if (organizationId) params.organizationId = organizationId;
    if (schoolId) params.schoolId = schoolId;
    await api.delete<ApiResponse<boolean>>('/storage/settings', { params });
  },
};
