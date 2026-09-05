'use client';

import { api } from './api';
import type { ApiResponse } from '@/types';

export interface StaffAttendanceRecord {
  id: string; staffId: string; schoolId: string; date: string;
  status: string; checkIn?: string; checkOut?: string; remarks?: string;
}

export interface StaffDailyReport {
  summary: { date: string; totalStaff: number; present: number; late: number; absent: number; leave: number; unmarked: number };
  staff: { id: string; name: string; email: string; role: string; attendance?: StaffAttendanceRecord | null }[];
}

const staffAttEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    staffDailyAttendance: build.query<StaffDailyReport, string | void>({
      query: (date) => ({ url: '/staff-attendance/daily', params: date ? { date } : undefined }),
      transformResponse: (res: ApiResponse<StaffDailyReport>) => res.data,
      providesTags: ['StaffAttendance'],
    }),
  }),
});

export const { useStaffDailyAttendanceQuery } = staffAttEndpoints;
