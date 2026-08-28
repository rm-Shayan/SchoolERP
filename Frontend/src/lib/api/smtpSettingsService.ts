import api from './client';
import type { ApiResponse, SmtpSettingsStatus, SmtpSettingsPayload, SmtpTestResult } from '@/types';

/**
 * Per-tenant SMTP (outgoing mail) settings — PRIMARY + SECONDARY failover.
 * Backend: /api/v1/smtp/settings — SUPER_ADMIN kisi bhi org/branch ke liye,
 * ADMIN sirf apni org/branch ke liye.
 */
export const smtpSettingsService = {
  getStatus: async (organizationId?: string | null, schoolId?: string | null): Promise<SmtpSettingsStatus> => {
    const params: Record<string, string> = {};
    if (organizationId) params.organizationId = organizationId;
    if (schoolId) params.schoolId = schoolId;
    const res = await api.get<ApiResponse<SmtpSettingsStatus>>('/smtp/settings', { params });
    return res.data.data;
  },

  save: async (payload: SmtpSettingsPayload): Promise<unknown> => {
    const res = await api.put<ApiResponse<unknown>>('/smtp/settings', payload);
    return res.data.data;
  },

  remove: async (
    organizationId?: string | null,
    schoolId?: string | null,
    tier: 'PRIMARY' | 'SECONDARY' = 'PRIMARY'
  ): Promise<void> => {
    const params: Record<string, string> = { tier };
    if (organizationId) params.organizationId = organizationId;
    if (schoolId) params.schoolId = schoolId;
    await api.delete<ApiResponse<boolean>>('/smtp/settings', { params });
  },

  sendTestEmail: async (
    organizationId?: string | null,
    schoolId?: string | null
  ): Promise<SmtpTestResult> => {
    const res = await api.post<ApiResponse<SmtpTestResult>>('/smtp/settings/test-send', {
      organizationId: organizationId || undefined,
      schoolId: schoolId || undefined,
    });
    return res.data.data;
  },
};
