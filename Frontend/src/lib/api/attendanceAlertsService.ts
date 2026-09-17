import api from './client';
import type { ApiResponse } from '@/types';

export interface AttendanceAlertsResult {
  success: boolean;
  totalAlerts: number;
}

export const attendanceAlertsService = {
  // POST /attendance/alerts/send — SUPER_ADMIN, ADMIN
  // Manual force-trigger for today's absent/late attendance alerts.
  sendNow: async (): Promise<AttendanceAlertsResult> => {
    const res = await api.post<ApiResponse<AttendanceAlertsResult>>('/attendance/alerts/send');
    return res.data.data;
  },
};