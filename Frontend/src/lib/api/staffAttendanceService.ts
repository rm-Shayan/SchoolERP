import client from './client';

export interface StaffAttendanceRecord {
  id: string;
  staffId: string;
  schoolId: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  phone?: string;
  avatarUrl?: string;
  attendance?: StaffAttendanceRecord | null;
}

export interface StaffDailyReport {
  summary: {
    date: string;
    totalStaff: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    unmarked: number;
  };
  staff: StaffMember[];
}

export interface StaffMonthlyReport {
  month: number;
  year: number;
  /** which weekdays are off — [0..6] (0=Sun .. 6=Sat). Default [0,6]. */
  weeklyOff?: number[];
  records: {
    staff: { id: string; name: string; role: string; username?: string };
    days: Record<string, number>;
    total: number;
  }[];
}

export const staffAttendanceService = {
  /** Admin: mark single staff attendance */
  markAttendance(data: {
    staffId: string;
    date?: string;
    status: string;
    remarks?: string;
    checkIn?: string;
  }) {
    return client.post<{ data: StaffAttendanceRecord }>('/staff-attendance/mark', data);
  },

  /** Gate scanner: staff ID-card QR se check-in */
  scanCheckIn(token: string) {
    return client.post<{
      data: { alreadyCheckedIn: boolean; staffName: string; record: StaffAttendanceRecord };
    }>('/staff-attendance/checkin', { token });
  },

  /** Admin: bulk mark attendance */
  bulkMark(data: {
    date: string;
    records: { staffId: string; status: string; remarks?: string; checkIn?: string }[];
  }) {
    return client.post<{ data: { succeeded: number; failed: number; total: number } }>('/staff-attendance/bulk', data);
  },

  /** Admin: daily report */
  getDailyReport(date?: string) {
    return client.get<{ data: StaffDailyReport }>('/staff-attendance/daily', { params: { date } });
  },

  /** Admin: monthly report */
  getMonthlyReport(year?: number, month?: number) {
    return client.get<{ data: StaffMonthlyReport }>('/staff-attendance/monthly', { params: { year, month } });
  },

  /** Admin: delete attendance record */
  deleteRecord(id: string) {
    return client.delete<{ data: { deleted: boolean; id: string } }>(`/staff-attendance/${id}`);
  },

  /** Admin: update attendance record */
  updateRecord(id: string, data: { status?: string; remarks?: string; checkIn?: string }) {
    return client.put<{ data: StaffAttendanceRecord }>(`/staff-attendance/${id}`, data);
  },

  /** Admin: export attendance as Excel/CSV */
  exportAttendance(params?: { startDate?: string; endDate?: string; format?: 'xlsx' | 'csv' }) {
    return client.get('/staff-attendance/export', {
      params,
      responseType: 'blob',
    });
  },

  /** Admin: import attendance from Excel */
  importAttendance(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return client.post<{ data: { succeeded: number; failed: number; total: number; errors: string[] } }>(
      '/staff-attendance/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  /** Admin: download import template */
  downloadImportTemplate() {
    return client.get('/staff-attendance/download-template', { responseType: 'blob' });
  },

  /** Staff: own attendance */
  getMyAttendance(params?: { startDate?: string; endDate?: string }) {
    return client.get<{ data: { records: StaffAttendanceRecord[]; summary: Record<string, number> } }>('/staff-attendance/my', { params });
  },
};
