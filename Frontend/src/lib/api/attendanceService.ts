import api from './client';
import type { ApiResponse, AttendanceRecord, AttendanceStatus, AttendanceYearSummary, DailyAttendanceReport, MonthlyAttendanceReport, OffDay, User } from '@/types';

export interface ScanPayload {
  identifierCode: string;
  deviceId?: string;
  method?: 'QR' | 'MANUAL' | 'RFID';
  scannedAt?: string;
}

export interface FeeMonthStatus {
  month: string;       // "2026-08"
  totalAmount: number;
  paidAmount: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
}

export interface FeeScanStatus {
  term: string | null;    // e.g. "Term 1"
  records: FeeMonthStatus[];
}

export interface ScanResult {
  studentId: string;
  studentName: string;
  rollNumber: string;
  imageUrl?: string;
  identifierCode: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus | string;
  scannedAt: string;
  feeStatus?: FeeScanStatus | null;
}

export interface OfflineScan {
  identifierCode: string;
  deviceId?: string;
  method?: 'QR' | 'MANUAL' | 'RFID';
  scannedAt: string;
}

export interface SectionBulkRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface Device {
  id: string;
  deviceName: string;
  type: string;
  deviceMac?: string | null;
  location?: string | null;
}

export const attendanceService = {
  // POST /attendance/scan — ATTENDANCE role
  scan: async (data: ScanPayload): Promise<ScanResult> => {
    const res = await api.post<ApiResponse<ScanResult>>('/attendance/scan', data);
    return res.data.data;
  },

  // POST /attendance/sync — SUPER_ADMIN, ADMIN, RECEPTIONIST
  syncOffline: async (scans: OfflineScan[]): Promise<{ synced: number; failed: number }> => {
    const res = await api.post<ApiResponse<{ synced: number; failed: number }>>('/attendance/sync', { scans });
    return res.data.data;
  },

  // POST /attendance/devices — SUPER_ADMIN, ADMIN, RECEPTIONIST
  registerDevice: async (data: { schoolId: string; deviceName: string; type?: string; deviceMac?: string; location?: string }): Promise<Device> => {
    const res = await api.post<ApiResponse<Device>>('/attendance/devices', data);
    return res.data.data;
  },

  // GET /attendance/devices — ATTENDANCE role
  getDevices: async (schoolId?: string): Promise<Device[]> => {
    const res = await api.get<ApiResponse<Device[]>>('/attendance/devices', { params: { schoolId } });
    return res.data.data;
  },

  // POST /attendance/section-bulk — SUPER_ADMIN, ADMIN, TEACHER
  markSectionBulk: async (data: { sectionId: string; date: string; records: SectionBulkRecord[] }): Promise<void> => {
    await api.post('/attendance/section-bulk', data);
  },

  // GET /attendance/staff — SUPER_ADMIN, ADMIN
  getStaffAttendance: async (schoolId?: string): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>('/attendance/staff', { params: { schoolId } });
    return res.data.data;
  },

  // POST /attendance/override — SUPER_ADMIN, ADMIN, TEACHER
  manualOverride: async (data: {
    studentId: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
  }): Promise<AttendanceRecord> => {
    const res = await api.post<ApiResponse<AttendanceRecord>>('/attendance/override', data);
    return res.data.data;
  },

  // GET /attendance/daily — ALL_STAFF
  // Backend returns { summary, records } — pehle type array tha (galat),
  // AdminDashboard us par .filter() karta tha → silent crash, sab cards 0.
  getDailyReport: async (params?: { schoolId?: string; sectionId?: string; date?: string }): Promise<DailyAttendanceReport> => {
    const res = await api.get<ApiResponse<DailyAttendanceReport>>('/attendance/daily', { params });
    return res.data.data;
  },

  // GET /attendance/students/:studentId — ALL_STAFF
  getStudentHistory: async (studentId: string, params?: { startDate?: string; endDate?: string }): Promise<AttendanceRecord[]> => {
    const res = await api.get<ApiResponse<AttendanceRecord[]>>(`/attendance/students/${studentId}`, { params });
    return res.data.data;
  },

  // GET /attendance/students/:studentId/yearly-summaries — ALL_STAFF
  getYearlySummaries: async (studentId: string): Promise<AttendanceYearSummary[]> => {
    const res = await api.get<ApiResponse<AttendanceYearSummary[]>>(`/attendance/students/${studentId}/yearly-summaries`);
    return res.data.data;
  },

  // GET /attendance/monthly — SUPER_ADMIN, ADMIN
  getMonthlyReport: async (params: { schoolId?: string; year: number; month: number }): Promise<MonthlyAttendanceReport> => {
    const res = await api.get<ApiResponse<MonthlyAttendanceReport>>('/attendance/monthly', { params });
    return res.data.data;
  },

  // ─── OFF DAYS / HOLIDAYS + WEEKLY OFF (SUPER_ADMIN, ADMIN) ────────────────
  getOffDays: (schoolId?: string): Promise<OffDay[]> =>
    api.get<ApiResponse<OffDay[]>>('/attendance/off-days', { params: { schoolId } }).then((r) => r.data.data),
  addOffDay: (data: { schoolId?: string; date: string; reason?: string }): Promise<{ offDays: OffDay[] }> =>
    api.post<ApiResponse<{ offDays: OffDay[] }>>('/attendance/off-days', data).then((r) => r.data.data),
  removeOffDay: (date: string, schoolId?: string): Promise<{ offDays: OffDay[] }> =>
    api.delete<ApiResponse<{ offDays: OffDay[] }>>(`/attendance/off-days/${date}`, { params: { schoolId } }).then((r) => r.data.data),
  updateWeeklyOff: (data: { schoolId?: string; weekdays: number[] }): Promise<{ weeklyOff: number[] }> =>
    api.put<ApiResponse<{ weeklyOff: number[] }>>('/attendance/weekly-off', data).then((r) => r.data.data),
  // PUT /attendance/:id — update single record
  updateRecord: async (id: string, data: { status?: string; remarks?: string }): Promise<AttendanceRecord> => {
    const res = await api.put<ApiResponse<AttendanceRecord>>(`/attendance/${id}`, data);
    return res.data.data;
  },

  // DELETE /attendance/:id
  deleteRecord: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    const res = await api.delete<ApiResponse<{ deleted: boolean; id: string }>>(`/attendance/${id}`);
    return res.data.data;
  },
};
