import api from './client';
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

export const teachingAssignmentService = {
  // POST /teaching-assignments/schools/:schoolId — MANAGEMENT
  assign: async (schoolId: string, data: TeachingAssignmentPayload): Promise<TeachingAssignment> => {
    const res = await api.post<ApiResponse<TeachingAssignment>>(`/teaching-assignments/schools/${schoolId}`, data);
    return res.data.data;
  },

  // GET /teaching-assignments/schools/:schoolId — ALL_STAFF
  list: async (schoolId: string, query?: { teacherId?: string; classId?: string }): Promise<TeachingAssignment[]> => {
    const res = await api.get<ApiResponse<TeachingAssignment[]>>(`/teaching-assignments/schools/${schoolId}`, {
      params: query,
    });
    return res.data.data;
  },

  // GET /teaching-assignments/schools/:schoolId/me — teacher ke apne assignments
  listMine: async (schoolId: string): Promise<TeachingAssignment[]> => {
    const res = await api.get<ApiResponse<TeachingAssignment[]>>(`/teaching-assignments/schools/${schoolId}/me`);
    return res.data.data;
  },

  // DELETE /teaching-assignments/:id — MANAGEMENT
  remove: async (id: string): Promise<void> => {
    await api.delete(`/teaching-assignments/${id}`);
  },
};