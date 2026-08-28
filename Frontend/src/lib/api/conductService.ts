import api from './client';
import type { ApiResponse, RemarkType } from '@/types';

export interface ConductRemark {
  id: string;
  studentId: string;
  teacherId: string;
  sectionId: string;
  type: RemarkType;
  title: string;
  description?: string;
  date: string;
  createdAt: string;
}

export const conductService = {
  // POST /conduct/remarks — ACADEMIC
  create: async (data: {
    studentId: string;
    type: RemarkType;
    title: string;
    description?: string;
    date?: string;
  }): Promise<ConductRemark> => {
    const res = await api.post<ApiResponse<ConductRemark>>('/conduct/remarks', data);
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

  // GET /conduct/remarks/:id — ALL_STAFF
  getById: async (id: string): Promise<ConductRemark> => {
    const res = await api.get<ApiResponse<ConductRemark>>(`/conduct/remarks/${id}`);
    return res.data.data;
  },
};
