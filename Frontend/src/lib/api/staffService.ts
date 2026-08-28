import api from './client';
import type { ApiResponse, User } from '@/types';

export interface StaffCreatePayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
  schoolId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Platform-wide user directory — GET /auth/users/all (SUPER_ADMIN)
export interface PlatformUserStats {
  total: number;
  active: number;
  inactive: number;
  orgs: number;
}

export interface PlatformUserFilters {
  search?: string;
  role?: string;
  status?: string;
  reason?: string;
}

export interface PlatformUserDirectory extends PaginatedResult<User> {
  stats: PlatformUserStats;
}

export const staffService = {
  // GET /auth/users — MANAGEMENT (paginated)
  getAll: async (params?: { schoolId?: string; role?: string; page?: number; pageSize?: number }): Promise<PaginatedResult<User>> => {
    const res = await api.get<ApiResponse<PaginatedResult<User>>>('/auth/users', { params });
    return res.data.data;
  },

  // GET /auth/users/all — SUPER_ADMIN platform directory (server-side filters + pagination)
  getAllPlatform: async (params?: { page?: number; pageSize?: number } & PlatformUserFilters): Promise<PlatformUserDirectory> => {
    const res = await api.get<ApiResponse<PlatformUserDirectory>>('/auth/users/all', { params });
    return res.data.data;
  },

  // GET /auth/users/all/export — SUPER_ADMIN (CSV download with current filters)
  exportPlatformCsv: async (params?: PlatformUserFilters): Promise<void> => {
    const res = await api.get<string>('/auth/users/all/export', { params, responseType: 'text' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // GET /auth/users/:id — MANAGEMENT
  getById: async (id: string): Promise<User> => {
    const res = await api.get<ApiResponse<User>>(`/auth/users/${id}`);
    return res.data.data;
  },

  // POST /auth/users — MANAGEMENT
  create: async (data: StaffCreatePayload): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/auth/users', data);
    return res.data.data;
  },

  // POST /auth/users/sample — MANAGEMENT (demo staff + class teacher assignment)
  createSample: async (): Promise<{
    created: number;
    password: string;
    items: { name: string; email: string; username: string; role: string; classTeacher: string | null }[];
  }> => {
    const res = await api.post<ApiResponse<{ created: number; password: string; items: { name: string; email: string; username: string; role: string; classTeacher: string | null }[] }>>('/auth/users/sample');
    return res.data.data;
  },

  // PATCH /auth/users/:id — MANAGEMENT
  update: async (id: string, data: { name?: string; phone?: string; role?: string; isActive?: boolean }): Promise<User> => {
    const res = await api.patch<ApiResponse<User>>(`/auth/users/${id}`, data);
    return res.data.data;
  },

  // DELETE /auth/users/:id — MANAGEMENT (soft-deactivate)
  deactivate: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`/auth/users/${id}`, { data: reason ? { reason } : undefined });
  },

  // PATCH /auth/users/:id/reactivate — MANAGEMENT
  reactivate: async (id: string): Promise<void> => {
    await api.patch(`/auth/users/${id}/reactivate`);
  },

  // POST /auth/users/import — MANAGEMENT (Excel bulk import)
  importExcel: async (file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>(
      '/auth/users/import',
      formData
    );
    return res.data.data;
  },

  // POST /auth/users/:id/reset-password — MANAGEMENT
  resetPassword: async (userId: string, newPassword: string): Promise<boolean> => {
    const res = await api.post<ApiResponse<boolean>>(`/auth/users/${userId}/reset-password`, { newPassword });
    return res.data.data;
  },

  // GET /auth/users/export — Export staff as Excel (.xlsx)
  exportExcel: async (): Promise<Blob> => {
    const res = await api.get('/auth/users/export', { responseType: 'blob' });
    return res.data;
  },

  // GET /auth/users/import-template — Download staff import template
  downloadImportTemplate: async (): Promise<Blob> => {
    const res = await api.get('/auth/users/import-template', { responseType: 'blob' });
    return res.data;
  },
};
