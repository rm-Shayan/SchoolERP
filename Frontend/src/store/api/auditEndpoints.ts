'use client';

import { api } from './api';
import type { AuditLogsResponse } from '@/types';
import type { ApiResponse } from '@/types';

const auditEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    auditLogs: build.query<AuditLogsResponse, Record<string, unknown>>({
      query: (params) => ({ url: '/audit-logs', params }),
      transformResponse: (res: ApiResponse<AuditLogsResponse>) => res.data,
      providesTags: ['Audit'],
    }),
  }),
});

export const { useAuditLogsQuery } = auditEndpoints;
