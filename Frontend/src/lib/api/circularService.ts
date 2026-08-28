import api from './client';
import type { ApiResponse } from '@/types';

export type CircularAudience = 'PARENTS' | 'TEACHERS' | 'ALL';

export interface Circular {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  mediaUrl?: string;
  audience: CircularAudience;
  createdAt: string;
}

export interface CreateCircularPayload {
  title: string;
  content: string;
  mediaUrl?: string;
  audience?: CircularAudience;
}

export interface CircularListEnvelope {
  items: Circular[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCircularResult {
  circular: Circular;
  notifiedParents: number;
  notifiedStaff: number;
}

export const circularService = {
  // POST /circulars/schools/:schoolId — MANAGEMENT
  create: async (schoolId: string, data: CreateCircularPayload): Promise<CreateCircularResult> => {
    const res = await api.post<ApiResponse<CreateCircularResult>>(`/circulars/schools/${schoolId}`, data);
    return res.data.data;
  },

  // GET /circulars/schools/:schoolId — ALL_STAFF
  getBySchool: async (schoolId: string): Promise<Circular[]> => {
    const res = await api.get<ApiResponse<CircularListEnvelope>>(`/circulars/schools/${schoolId}`);
    return res.data.data.items;
  },

  // GET /circulars/:id — ALL_STAFF
  getById: async (id: string): Promise<Circular> => {
    const res = await api.get<ApiResponse<Circular>>(`/circulars/${id}`);
    return res.data.data;
  },

  // DELETE /circulars/:id — MANAGEMENT
  remove: async (id: string): Promise<void> => {
    await api.delete(`/circulars/${id}`);
  },
};
