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
  // GET /audit-logs — MANAGEMENT (SUPER_ADMIN sees all, ADMIN sees own branch)
  list: async (params?: AuditLogParams): Promise<AuditLogsResponse> => {
    const res = await api.get<ApiResponse<AuditLogsResponse>>('/audit-logs', { params });
    return res.data.data;
  },
};
