import api from './client';
import type { ApiResponse, AuditLogsResponse } from '@/types';

export interface AuditLogParams {
  action?: string;
  entityType?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export const auditLogService = {
  list: async (params?: AuditLogParams): Promise<AuditLogsResponse> => {
    // Strip undefined / empty-string values so Zod validation never rejects
    const clean: Record<string, string | number> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') clean[k] = v;
      }
    }
    const res = await api.get<ApiResponse<AuditLogsResponse>>('/audit-logs', { params: clean });
    return res.data.data;
  },

  exportCsv: async (params?: AuditLogParams): Promise<void> => {
    const clean: Record<string, string | number> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') clean[k] = v;
      }
    }
    const res = await api.get<string>('/audit-logs/export', {
      params: clean,
      responseType: 'text',
    });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
