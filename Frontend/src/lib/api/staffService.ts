import api from './client';
import { cached, invalidate } from './serviceCache';
import type { ApiResponse, User } from '@/types';

export interface StaffCreatePayload {
  name: string; email: string; password?: string; phone?: string; role: string; schoolId?: string;
}

export interface PaginatedResult<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number; }

export interface PlatformUserStats { total: number; active: number; inactive: number; orgs: number; }

export interface PlatformUserFilters { search?: string; role?: string; status?: string; reason?: string; organizationId?: string; }

export interface PlatformUserDirectory extends PaginatedResult<User> { stats: PlatformUserStats; }

const CACHE_TTL = 10_000;

export const staffService = {
  getAll: async (params?: { schoolId?: string; role?: string; page?: number; pageSize?: number }): Promise<PaginatedResult<User>> => {
    const key = `staff:${JSON.stringify(params ?? {})}`;
    return cached(key, CACHE_TTL, async () => {
      const res = await api.get<ApiResponse<PaginatedResult<User>>>('/auth/users', { params });
      return res.data.data;
    });
  },

  getAllPlatform: async (params?: { page?: number; pageSize?: number } & PlatformUserFilters): Promise<PlatformUserDirectory> => {
    const res = await api.get<ApiResponse<PlatformUserDirectory>>('/auth/users/all', { params });
    return res.data.data;
  },

  exportPlatformCsv: async (params?: PlatformUserFilters): Promise<void> => {
    const res = await api.get<string>('/auth/users/all/export', { params, responseType: 'text' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  },

  getById: async (id: string): Promise<User> => {
    const res = await api.get<ApiResponse<User>>(`/auth/users/${id}`);
    return res.data.data;
  },

  create: async (data: StaffCreatePayload): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/auth/users', data);
    invalidate('staff:');
    return res.data.data;
  },

  createSample: async (): Promise<{ created: number; password: string; items: { name: string; email: string; username: string; role: string; classTeacher: string | null }[] }> => {
    const res = await api.post<ApiResponse<{ created: number; password: string; items: { name: string; email: string; username: string; role: string; classTeacher: string | null }[] }>>('/auth/users/sample');
    invalidate('staff:');
    return res.data.data;
  },

  update: async (id: string, data: { name?: string; phone?: string; role?: string; isActive?: boolean }): Promise<User> => {
    const res = await api.patch<ApiResponse<User>>(`/auth/users/${id}`, data);
    invalidate('staff:');
    return res.data.data;
  },

  deactivate: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`/auth/users/${id}`, { data: reason ? { reason } : undefined });
    invalidate('staff:');
  },

  reactivate: async (id: string): Promise<void> => {
    await api.patch(`/auth/users/${id}/reactivate`);
    invalidate('staff:');
  },

  importExcel: async (file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData(); formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>('/auth/users/import', formData);
    invalidate('staff:');
    return res.data.data;
  },

  resetPassword: async (userId: string, newPassword: string): Promise<boolean> => {
    const res = await api.post<ApiResponse<boolean>>(`/auth/users/${userId}/reset-password`, { newPassword });
    return res.data.data;
  },

  exportExcel: async (): Promise<Blob> => {
    const res = await api.get('/auth/users/export', { responseType: 'blob' });
    return res.data;
  },

  downloadImportTemplate: async (): Promise<Blob> => {
    const res = await api.get('/auth/users/import-template', { responseType: 'blob' });
    return res.data;
  },
};
