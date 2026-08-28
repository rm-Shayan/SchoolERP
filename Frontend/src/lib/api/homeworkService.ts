import api from './client';
import type { ApiResponse } from '@/types';

export interface HomeworkCreator {
  id: string;
  name: string;
  role: string;
}

export interface HomeworkSectionRef {
  id: string;
  name: string;
  class?: { id: string; name: string };
}

// Matches backend HomeworkBroadcast model (schema.prisma)
export interface Homework {
  id: string;
  schoolId: string;
  sectionId: string;
  createdById?: string | null;
  createdBy?: HomeworkCreator | null;
  title: string;
  content: string;
  mediaUrl?: string | null;
  sentAt: string;
  section?: HomeworkSectionRef;
}

export interface HomeworkListResponse {
  items: Homework[];
  total: number;
  page: number;
  pageSize: number;
}

export const homeworkService = {
  // POST /homework — ACADEMIC (SUPER_ADMIN, ADMIN, TEACHER)
  create: async (data: { sectionId: string; title: string; content: string }): Promise<Homework> => {
    const res = await api.post<ApiResponse<{ broadcast: Homework }>>('/homework', data);
    return res.data.data.broadcast;
  },

  // GET /homework — ALL_STAFF (paginated, school-scoped server-side)
  getAll: async (params?: { sectionId?: string; page?: number; pageSize?: number }): Promise<HomeworkListResponse> => {
    const res = await api.get<ApiResponse<HomeworkListResponse>>('/homework', { params });
    return res.data.data;
  },

  // GET /homework/:id — ALL_STAFF
  getById: async (id: string): Promise<Homework> => {
    const res = await api.get<ApiResponse<Homework>>(`/homework/${id}`);
    return res.data.data;
  },

  // PUT /homework/:id — ACADEMIC (admin any, teacher own)
  update: async (id: string, data: { title?: string; content?: string }): Promise<Homework> => {
    const res = await api.put<ApiResponse<Homework>>(`/homework/${id}`, data);
    return res.data.data;
  },

  // DELETE /homework/:id — ACADEMIC (admin any, teacher own)
  remove: async (id: string): Promise<void> => {
    await api.delete(`/homework/${id}`);
  },
};
