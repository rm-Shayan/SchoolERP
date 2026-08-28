import api from './client';
import type { ApiResponse, Organization, School, Student, Parent, User } from '@/types';

interface BlockPayload {
  reason?: string;
}

export const moderationService = {
  // POST /moderation/organizations/:id/block — SUPER_ADMIN
  blockOrganization: async (id: string, reason?: string): Promise<Organization> => {
    const res = await api.post<ApiResponse<Organization>>(`/moderation/organizations/${id}/block`, { reason } as BlockPayload);
    return res.data.data;
  },
  // POST /moderation/organizations/:id/unblock — SUPER_ADMIN
  unblockOrganization: async (id: string): Promise<Organization> => {
    const res = await api.post<ApiResponse<Organization>>(`/moderation/organizations/${id}/unblock`);
    return res.data.data;
  },

  // POST /moderation/schools/:id/block — SUPER_ADMIN
  blockSchool: async (id: string, reason?: string): Promise<School> => {
    const res = await api.post<ApiResponse<School>>(`/moderation/schools/${id}/block`, { reason } as BlockPayload);
    return res.data.data;
  },
  // POST /moderation/schools/:id/unblock — SUPER_ADMIN
  unblockSchool: async (id: string): Promise<School> => {
    const res = await api.post<ApiResponse<School>>(`/moderation/schools/${id}/unblock`);
    return res.data.data;
  },

  // POST /moderation/users/:id/block — MANAGEMENT (branch admin own branch only)
  blockUser: async (id: string, reason?: string): Promise<User> => {
    const res = await api.post<ApiResponse<User>>(`/moderation/users/${id}/block`, { reason } as BlockPayload);
    return res.data.data;
  },
  // POST /moderation/users/:id/unblock — MANAGEMENT
  unblockUser: async (id: string): Promise<User> => {
    const res = await api.post<ApiResponse<User>>(`/moderation/users/${id}/unblock`);
    return res.data.data;
  },

  // POST /moderation/students/:id/block — MANAGEMENT
  blockStudent: async (id: string, reason?: string): Promise<Student> => {
    const res = await api.post<ApiResponse<Student>>(`/moderation/students/${id}/block`, { reason } as BlockPayload);
    return res.data.data;
  },
  // POST /moderation/students/:id/unblock — MANAGEMENT
  unblockStudent: async (id: string): Promise<Student> => {
    const res = await api.post<ApiResponse<Student>>(`/moderation/students/${id}/unblock`);
    return res.data.data;
  },

  // POST /moderation/parents/:id/block — MANAGEMENT
  blockParent: async (id: string, reason?: string): Promise<Parent> => {
    const res = await api.post<ApiResponse<Parent>>(`/moderation/parents/${id}/block`, { reason } as BlockPayload);
    return res.data.data;
  },
  // POST /moderation/parents/:id/unblock — MANAGEMENT
  unblockParent: async (id: string): Promise<Parent> => {
    const res = await api.post<ApiResponse<Parent>>(`/moderation/parents/${id}/unblock`);
    return res.data.data;
  },
};
