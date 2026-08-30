import api from './client';
import { cached, invalidate } from './serviceCache';
import type { ApiResponse } from '@/types';

export interface TeachingAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string | null;
  sectionId: string | null;
  teacher?: { id: string; name: string };
  class?: { id: string; name: string };
  section?: { id: string; name: string } | null;
  subject?: { id: string; name: string } | null;
}

export interface TeachingAssignmentPayload {
  teacherId: string;
  classId: string;
  sectionId?: string;
  subjectId?: string;
}

export interface TeacherDashboardStats {
  assignments: number;
  upcomingPtms: number;
  totalHomework: number;
  totalTimetableSlots: number;
}

const CACHE_TTL = 10_000;

export const teachingAssignmentService = {
  assign: async (schoolId: string, data: TeachingAssignmentPayload): Promise<TeachingAssignment> => {
    const res = await api.post<ApiResponse<TeachingAssignment>>(`/teaching-assignments/schools/${schoolId}`, data);
    invalidate(`assigns:${schoolId}`);
    return res.data.data;
  },

  list: async (schoolId: string, query?: { teacherId?: string; classId?: string }): Promise<TeachingAssignment[]> => {
    const key = `assigns:${schoolId}:${JSON.stringify(query ?? {})}`;
    return cached(key, CACHE_TTL, async () => {
      const res = await api.get<ApiResponse<TeachingAssignment[]>>(`/teaching-assignments/schools/${schoolId}`, { params: query });
      return res.data.data;
    });
  },

  listMine: async (schoolId: string): Promise<TeachingAssignment[]> => {
    return cached(`assigns:mine:${schoolId}`, CACHE_TTL, async () => {
      const res = await api.get<ApiResponse<TeachingAssignment[]>>(`/teaching-assignments/schools/${schoolId}/me`);
      return res.data.data;
    });
  },

  getDashboardStats: async (schoolId: string): Promise<TeacherDashboardStats> => {
    const res = await api.get<ApiResponse<TeacherDashboardStats>>(`/teaching-assignments/schools/${schoolId}/dashboard-stats`);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/teaching-assignments/${id}`);
    invalidate('assigns:');
  },
};
