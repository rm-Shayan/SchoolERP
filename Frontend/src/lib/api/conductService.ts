import api from './client';
import type { ApiResponse, RemarkType } from '@/types';

export interface ConductRemark {
  id: string;
  studentId: string;
  teacherId: string;
  academicYearId?: string | null;
  type: RemarkType;
  title: string;
  comment: string;
  description?: string;
  date: string;
  createdAt: string;
  student?: { id: string; firstName: string; lastName: string; rollNumber: string; section?: { name: string; class?: { name: string } } };
  teacher?: { id: string; name: string };
  academicYear?: { id: string; name: string } | null;
}

export interface ConductRemarkListResponse {
  items: ConductRemark[];
  total: number;
  page: number;
  pageSize: number;
}

export const conductService = {
  // POST /conduct/remarks — ACADEMIC (ADMIN optional teacherId = on-behalf author)
  create: async (data: {
    studentId: string;
    type: RemarkType;
    title?: string;
    comment?: string;
    description?: string;
    date?: string;
    teacherId?: string;
  }): Promise<ConductRemark> => {
    const res = await api.post<ApiResponse<ConductRemark>>('/conduct/remarks', {
      ...data,
      comment: data.comment ?? data.title,
    });
    return res.data.data;
  },

  // GET /conduct/remarks/students/:id — ALL_STAFF
  getByStudent: async (studentId: string): Promise<ConductRemark[]> => {
    const res = await api.get<ApiResponse<ConductRemark[]>>(`/conduct/remarks/students/${studentId}`);
    return res.data.data;
  },

  // GET /conduct/remarks/sections/:sectionId — ALL_STAFF
  getBySection: async (sectionId: string): Promise<ConductRemark[]> => {
    const res = await api.get<ApiResponse<ConductRemark[]>>(`/conduct/remarks/sections/${sectionId}`);
    return res.data.data;
  },

  // GET /conduct/remarks/mine — ALL_STAFF (teacher's own)
  getMine: async (params?: { academicYearId?: string; page?: number; pageSize?: number }): Promise<ConductRemarkListResponse> => {
    const res = await api.get<ApiResponse<ConductRemarkListResponse>>('/conduct/remarks/mine', { params });
    return res.data.data;
  },

  // GET /conduct/remarks/school — ACADEMIC (admin view)
  listAll: async (params?: { type?: string; teacherId?: string; page?: number; pageSize?: number }): Promise<ConductRemarkListResponse> => {
    const res = await api.get<ApiResponse<ConductRemarkListResponse>>('/conduct/remarks/school', { params });
    return res.data.data;
  },

  // GET /conduct/remarks/:id — ALL_STAFF
  getById: async (id: string): Promise<ConductRemark> => {
    const res = await api.get<ApiResponse<ConductRemark>>(`/conduct/remarks/${id}`);
    return res.data.data;
  },

  // PATCH /conduct/remarks/:id — ACADEMIC
  update: async (id: string, data: { type?: RemarkType; comment?: string }): Promise<ConductRemark> => {
    const res = await api.patch<ApiResponse<ConductRemark>>(`/conduct/remarks/${id}`, data);
    return res.data.data;
  },

  // DELETE /conduct/remarks/:id — ACADEMIC
  remove: async (id: string): Promise<void> => {
    await api.delete(`/conduct/remarks/${id}`);
  },
};
