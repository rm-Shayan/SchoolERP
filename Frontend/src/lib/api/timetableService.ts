import api from './client';
import type { ApiResponse } from '@/types';

export interface TimetableSlot {
  id: string;
  sectionId: string;
  teacherId: string;
  subjectId: string;
  dayOfWeek: number; // 1=Monday ... 7=Sunday (matches backend)
  periodNumber?: number;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  subject?: { id: string; name: string };
  teacher?: { id: string; name: string };
}

export const timetableService = {
  // POST /timetable/sections/:sectionId — ACADEMIC
  createSlot: async (sectionId: string, data: {
    teacherId: string;
    subjectId: string;
    dayOfWeek: number;
    periodNumber?: number;
    startTime: string;
    endTime: string;
    roomNumber?: string;
  }): Promise<TimetableSlot> => {
    const res = await api.post<ApiResponse<TimetableSlot>>(`/timetable/sections/${sectionId}`, data);
    return res.data.data;
  },

  // GET /timetable/sections/:sectionId — ALL_STAFF
  getBySection: async (sectionId: string): Promise<TimetableSlot[]> => {
    const res = await api.get<ApiResponse<TimetableSlot[]>>(`/timetable/sections/${sectionId}`);
    return res.data.data.map((slot) => ({ ...slot, dayOfWeek: Number(slot.dayOfWeek) }));
  },

  // GET /timetable/teachers/:teacherId — ALL_STAFF
  getByTeacher: async (teacherId: string): Promise<TimetableSlot[]> => {
    const res = await api.get<ApiResponse<TimetableSlot[]>>(`/timetable/teachers/${teacherId}`);
    return res.data.data;
  },

  // GET /timetable/slots/:id — ALL_STAFF
  getSlot: async (id: string): Promise<TimetableSlot> => {
    const res = await api.get<ApiResponse<TimetableSlot>>(`/timetable/slots/${id}`);
    return res.data.data;
  },

  // PATCH /timetable/slots/:id — ACADEMIC
  updateSlot: async (id: string, data: Partial<TimetableSlot>): Promise<TimetableSlot> => {
    const res = await api.patch<ApiResponse<TimetableSlot>>(`/timetable/slots/${id}`, data);
    return res.data.data;
  },

  // DELETE /timetable/slots/:id — MANAGEMENT
  deleteSlot: async (id: string): Promise<void> => {
    await api.delete(`/timetable/slots/${id}`);
  },

  // DELETE /timetable/sections/:sectionId/slots — ACADEMIC (bulk clear, optional day)
  clearAllSlots: async (sectionId: string, dayOfWeek?: number): Promise<{ deletedCount: number }> => {
    const params = dayOfWeek !== undefined ? { dayOfWeek } : {};
    const res = await api.delete<ApiResponse<{ deletedCount: number }>>(`/timetable/sections/${sectionId}/slots`, { params });
    return res.data.data;
  },

  // POST /timetable/sections/:sectionId/import — ACADEMIC (Excel bulk import, async job)
  importExcel: async (sectionId: string, file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>(
      `/timetable/sections/${sectionId}/import`,
      formData
    );
    return res.data.data;
  },

  // GET /timetable/sections/:sectionId/export — ALL_STAFF (CSV download)
  exportCsv: async (sectionId: string): Promise<void> => {
    const res = await api.get<string>(`/timetable/sections/${sectionId}/export`, { responseType: 'text' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Client-side CSV template for timetable import
  downloadImportTemplate: async (): Promise<void> => {
    const headers = ['Day', 'Subject', 'Teacher', 'Start Time', 'End Time'];
    const sample = ['Monday', 'Mathematics', 'Mr. Ahmed', '08:00', '08:45'];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
