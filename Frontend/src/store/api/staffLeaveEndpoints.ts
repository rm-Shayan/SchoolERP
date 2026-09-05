'use client';

import { api } from './api';
import type { ApiResponse } from '@/types';

export interface StaffLeaveRequest {
  id: string; staffId: string; schoolId: string; date: string; dateTo?: string;
  leaveType: string; reason?: string; status: string; reviewedBy?: string;
  reviewedAt?: string; remarks?: string; createdAt: string;
  staff?: { id: string; name: string; email: string; role: string };
  reviewer?: { name: string };
}

export interface StaffLeaveListResponse {
  requests: StaffLeaveRequest[]; total: number; page: number; limit: number; totalPages: number;
}

const staffLeaveEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    staffLeaves: build.query<StaffLeaveListResponse, Record<string, unknown>>({
      query: (params) => ({ url: '/staff-leave', params }),
      transformResponse: (res: ApiResponse<StaffLeaveListResponse>) => res.data,
      providesTags: ['StaffLeave'],
    }),
  }),
});

export const { useStaffLeavesQuery } = staffLeaveEndpoints;
