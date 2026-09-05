'use client';

import { api } from './api';
import type { ApiResponse } from '@/types';

export interface LeaveRequest {
  id: string; studentId: string; parentId: string; schoolId: string;
  dateFrom: string; dateTo: string; reason: string; status: string;
  createdAt: string;
  student?: { id: string; firstName: string; lastName: string; rollNumber: string };
  parent?: { id: string; name: string };
}

export interface LeaveListResponse {
  requests: LeaveRequest[]; total: number; page: number; limit: number; totalPages: number;
}

const leaveEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    leaveRequests: build.query<LeaveListResponse, Record<string, unknown>>({
      query: (params) => ({ url: '/leave', params }),
      transformResponse: (res: ApiResponse<LeaveListResponse>) => res.data,
      providesTags: ['Leave'],
    }),
  }),
});

export const { useLeaveRequestsQuery } = leaveEndpoints;
