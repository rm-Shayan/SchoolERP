'use client';

import api from './client';
import type { ApiResponse, Student, StudentStatus } from '@/types';

export interface StudentCreatePayload {
  sectionId: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  gender?: string;
  dob?: string;
  parentName?: string;
  parentWhatsappNo?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentAddress?: string;
}

export interface StudentUpdatePayload {
  firstName?: string;
  lastName?: string;
  rollNumber?: string;
  gender?: string | null;
  dob?: string | null;
  sectionId?: string;
  parentName?: string;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentAddress?: string | null;
}

export interface StudentSummary {
  total: number;
  ACTIVE: number;
  GRADUATED: number;
  DROPPED_OUT: number;
  TRANSFERRED_OUT: number;
  blocked: number;
}

export interface StudentListParams {
  schoolId?: string;
  sectionId?: string;
  classId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** GET /students returns a paginated envelope ({ items, total, summary }). */
interface StudentListEnvelope {
  items: Student[];
  total: number;
  page: number;
  pageSize: number;
  summary?: StudentSummary;
}

export const studentService = {
  // GET /students — SCHOOL STAFF (filters: schoolId, sectionId, status, search, page)
  // Backend returns a paginated envelope — unwrap items.
  getAll: async (params?: StudentListParams): Promise<Student[]> => {
    const res = await api.get<ApiResponse<StudentListEnvelope>>('/students', { params });
    return res.data.data.items;
  },

  // GET /students — returns items + total + status summary (server-driven pagination).
  getPage: async (params?: StudentListParams): Promise<{ items: Student[]; total: number; summary: StudentSummary | null }> => {
    const res = await api.get<ApiResponse<StudentListEnvelope>>('/students', { params });
    return { items: res.data.data.items, total: res.data.data.total, summary: res.data.data.summary ?? null };
  },

  // POST /students/schools/:schoolId — SCHOOL STAFF
  create: async (schoolId: string, data: StudentCreatePayload): Promise<Student> => {
    const res = await api.post<ApiResponse<Student>>(`/students/schools/${schoolId}`, data);
    return res.data.data;
  },

  // GET /students/:id — SCHOOL STAFF
  getById: async (id: string): Promise<Student> => {
    const res = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return res.data.data;
  },

  // PATCH /students/:id — SCHOOL STAFF
  update: async (id: string, data: StudentUpdatePayload): Promise<Student> => {
    const res = await api.patch<ApiResponse<Student>>(`/students/${id}`, data);
    return res.data.data;
  },

  // DELETE /students/:id — SCHOOL STAFF (hard delete — permanent, overrides archive-only)
  remove: async (id: string): Promise<{ id: string }> => {
    const res = await api.delete<ApiResponse<{ id: string }>>(`/students/${id}`);
    return res.data.data;
  },

  // PATCH /students/:id/status — SCHOOL STAFF
  updateStatus: async (id: string, status: StudentStatus): Promise<Student> => {
    const res = await api.patch<ApiResponse<Student>>(`/students/${id}/status`, { status });
    return res.data.data;
  },

  // POST /students/schools/:schoolId/import — SCHOOL STAFF (Excel bulk import, async job)
  importExcel: async (schoolId: string, file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>(
      `/students/schools/${schoolId}/import`,
      formData
    );
    return res.data.data;
  },

  // GET /students/export — SCHOOL STAFF (CSV download with current filters)
  exportCsv: async (params?: StudentListParams): Promise<void> => {
    const res = await api.get<string>('/students/export', { params, responseType: 'text' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // POST /students/:id/photo — SCHOOL STAFF (upload student photo)
  uploadPhoto: async (id: string, file: File): Promise<Student> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<Student>>(`/students/${id}/photo`, formData);
    return res.data.data;
  },

  // POST /students/:id/reissue-id — opens the 2-sided ID card PDF in a new tab
  // (front + back), so the user can review and print both sides.
  downloadIdCard: async (id: string): Promise<void> => {
    const res = await api.post(`/students/${id}/reissue-id`, {}, { responseType: 'blob' });
    const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `id-card-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2_000);
  },

  // Client-side CSV template for student import
  downloadImportTemplate: async (): Promise<void> => {
    const headers = ['First Name','Last Name','Class Name','Section Name','Roll Number','Gender','DOB','Parent Name','Parent Phone','Parent Email','Parent Address'];
    const sample = ['Ahmed','Khan','Class 5','A','101','Male','2012-05-15','Mr. Khan','03001234567','khan@email.com','123 Main St'];
    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
