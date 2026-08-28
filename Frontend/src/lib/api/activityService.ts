import api from './client';
import type { ApiResponse } from '@/types';

export interface Activity {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

export const activityService = {
  // POST /activities/schools/:schoolId — MANAGEMENT
  create: async (schoolId: string, data: { name: string; description?: string; category?: string }): Promise<Activity> => {
    const res = await api.post<ApiResponse<Activity>>(`/activities/schools/${schoolId}`, data);
    return res.data.data;
  },

  // GET /activities/schools/:schoolId — ALL_STAFF
  getBySchool: async (schoolId: string): Promise<Activity[]> => {
    const res = await api.get<ApiResponse<Activity[]>>(`/activities/schools/${schoolId}`);
    return res.data.data;
  },

  // GET /activities/:id — ALL_STAFF
  getById: async (id: string): Promise<Activity> => {
    const res = await api.get<ApiResponse<Activity>>(`/activities/${id}`);
    return res.data.data;
  },

  // PATCH /activities/:id — MANAGEMENT
  update: async (id: string, data: Partial<{ name: string; description: string; category: string; isActive: boolean }>): Promise<Activity> => {
    const res = await api.patch<ApiResponse<Activity>>(`/activities/${id}`, data);
    return res.data.data;
  },

  // DELETE /activities/:id — MANAGEMENT
  remove: async (id: string): Promise<void> => {
    await api.delete(`/activities/${id}`);
  },
};
