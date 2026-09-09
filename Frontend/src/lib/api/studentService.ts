'use client';

import api from './client';
import type { ApiResponse, Student } from '@/types';
import type { StudentCreatePayload, StudentUpdatePayload, StudentListParams, StudentListEnvelope, PlatformStudentListParams, StudentSummary } from './studentTypes';

export type { StudentCreatePayload, StudentUpdatePayload, StudentListParams, StudentListEnvelope, PlatformStudentListParams, StudentSummary };

export const studentService = {
  getAll: async (params?: StudentListParams): Promise<Student[]> => {
    const res = await api.get<ApiResponse<StudentListEnvelope>>('/students', { params });
    return res.data.data.items;
  },
  getPage: async (params?: StudentListParams): Promise<{ items: Student[]; total: number; summary: import('./studentTypes').StudentSummary | null }> => {
    const res = await api.get<ApiResponse<StudentListEnvelope>>('/students', { params });
    return { items: res.data.data.items, total: res.data.data.total, summary: res.data.data.summary ?? null };
  },
  getStats: async (schoolId?: string): Promise<{ total: number; ACTIVE: number; GRADUATED: number; DROPPED_OUT: number; TRANSFERRED_OUT: number; blocked: number }> => {
    const res = await api.get<ApiResponse<{ total: number; ACTIVE: number; GRADUATED: number; DROPPED_OUT: number; TRANSFERRED_OUT: number; blocked: number }>>('/students/stats', { params: { schoolId } });
    return res.data.data;
  },
  create: async (schoolId: string, data: StudentCreatePayload): Promise<Student> => {
    const res = await api.post<ApiResponse<Student>>(`/students/schools/${schoolId}`, data);
    return res.data.data;
  },
  getById: async (id: string): Promise<Student> => {
    const res = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return res.data.data;
  },
  update: async (id: string, data: StudentUpdatePayload): Promise<Student> => {
    const res = await api.patch<ApiResponse<Student>>(`/students/${id}`, data);
    return res.data.data;
  },
  remove: async (id: string): Promise<{ id: string }> => {
    const res = await api.delete<ApiResponse<{ id: string }>>(`/students/${id}`);
    return res.data.data;
  },
  updateStatus: async (id: string, status: import('@/types').StudentStatus): Promise<Student> => {
    const res = await api.patch<ApiResponse<Student>>(`/students/${id}/status`, { status });
    return res.data.data;
  },
  rollback: async (id: string, remarks?: string): Promise<Student> => {
    const res = await api.post<ApiResponse<Student>>(`/students/${id}/rollback`, { remarks });
    return res.data.data;
  },
  importExcel: async (schoolId: string, file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>(`/students/schools/${schoolId}/import`, formData);
    return res.data.data;
  },
  exportCsv: async (params?: StudentListParams): Promise<void> => {
    const res = await api.get<string>('/students/export', { params, responseType: 'text' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  },
  uploadPhoto: async (id: string, file: File): Promise<Student> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<Student>>(`/students/${id}/photo`, formData);
    return res.data.data;
  },
  downloadIdCard: async (id: string): Promise<void> => {
    const res = await api.post(`/students/${id}/reissue-id`, {}, { responseType: 'blob' });
    const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `id-card-${id}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2_000);
  },
  getPlatform: async (params?: PlatformStudentListParams): Promise<StudentListEnvelope> => {
    const res = await api.get<ApiResponse<StudentListEnvelope>>('/students/platform', { params });
    return res.data.data;
  },
  downloadImportTemplate: async (): Promise<void> => {
    const headers = ['First Name','Last Name','Class Name','Section Name','Roll Number','Gender','DOB','Parent Name','Parent Phone','Parent Email','Parent Address'];
    const sample = ['Ahmed','Khan','Class 5','A','101','Male','2012-05-15','Mr. Khan','03001234567','khan@email.com','123 Main St'];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  },
};
