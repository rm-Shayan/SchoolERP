import api from './client';
import { downloadPdf } from './downloadPdf';
import type { ApiResponse } from '@/types';

export interface TimetableSlot {
  id: string;
  sectionId: string;
  teacherId: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject?: { id: string; name: string };
  teacher?: { id: string; name: string };
  section?: { id: string; name: string; class?: { name: string } };
}

export const timetableService = {
  createSlot: async (sectionId: string, data: {
    teacherId: string; subjectId: string; dayOfWeek: number;
    periodNumber?: number; startTime: string; endTime: string; roomNumber?: string;
  }): Promise<TimetableSlot> => {
    const res = await api.post<ApiResponse<TimetableSlot>>(`/timetable/sections/${sectionId}`, data);
    return res.data.data;
  },

  getBySection: async (sectionId: string): Promise<TimetableSlot[]> => {
    const res = await api.get<ApiResponse<TimetableSlot[]>>(`/timetable/sections/${sectionId}`);
    return res.data.data.map((slot) => ({ ...slot, dayOfWeek: Number(slot.dayOfWeek) }));
  },

  reorderSlots: async (sectionId: string, dayOfWeek: number, slotIds: string[]): Promise<void> => {
    await api.patch(`/timetable/sections/${sectionId}/reorder`, { dayOfWeek, slotIds });
  },

  getByTeacher: async (teacherId: string): Promise<TimetableSlot[]> => {
    const res = await api.get<ApiResponse<TimetableSlot[]>>(`/timetable/teachers/${teacherId}`);
    return res.data.data.map((slot) => ({ ...slot, dayOfWeek: Number(slot.dayOfWeek) }));
  },

  getSlot: async (id: string): Promise<TimetableSlot> => {
    const res = await api.get<ApiResponse<TimetableSlot>>(`/timetable/slots/${id}`);
    return res.data.data;
  },

  updateSlot: async (id: string, data: Partial<TimetableSlot>): Promise<TimetableSlot> => {
    const res = await api.patch<ApiResponse<TimetableSlot>>(`/timetable/slots/${id}`, data);
    return res.data.data;
  },

  deleteSlot: async (id: string): Promise<void> => {
    await api.delete(`/timetable/slots/${id}`);
  },

  clearAllSlots: async (sectionId: string, dayOfWeek?: number): Promise<{ deletedCount: number }> => {
    const params = dayOfWeek !== undefined ? { dayOfWeek } : {};
    const res = await api.delete<ApiResponse<{ deletedCount: number }>>(`/timetable/sections/${sectionId}/slots`, { params });
    return res.data.data;
  },

  importExcel: async (sectionId: string, file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>(`/timetable/sections/${sectionId}/import`, formData);
    return res.data.data;
  },

  exportCsv: async (sectionId: string): Promise<void> => {
    const res = await api.get<string>(`/timetable/sections/${sectionId}/export`, { responseType: 'text' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `timetable-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  },

  downloadSectionPdf: async (sectionId: string): Promise<void> => {
    await downloadPdf(`/timetable/sections/${sectionId}/pdf`, `timetable-${new Date().toISOString().slice(0, 10)}.pdf`);
  },

  downloadTeacherPdf: async (teacherId: string): Promise<void> => {
    await downloadPdf(`/timetable/teachers/${teacherId}/pdf`, `my-timetable-${new Date().toISOString().slice(0, 10)}.pdf`);
  },

  downloadImportTemplate: async (): Promise<void> => {
    const headers = ['Day', 'Subject', 'Teacher', 'Start Time', 'End Time'];
    const sample = ['Monday', 'Mathematics', 'Mr. Ahmed', '08:00', '08:45'];
    const csv = [headers.join(','), sample.join(',')].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'timetable-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  },
};
