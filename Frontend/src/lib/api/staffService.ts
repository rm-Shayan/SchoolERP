import api from './client';
import type { ApiResponse, User } from '@/types';

export interface SmtpPayload {
  host: string; port: number; secure: boolean; username: string; password: string;
}

export interface CloudinaryPayload {
  cloudName: string; apiKey: string; apiSecret: string;
}

export interface StaffCreatePayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
  organizationId?: string;
  schoolId?: string;
  // Teacher assignment
  teacherClassId?: string;
  teacherSectionId?: string;
  teacherSubjectId?: string;
  // Integration settings for ADMIN
  smtp?: SmtpPayload;
  cloudinary?: CloudinaryPayload;
}

export interface PaginatedResult<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number; }

export interface PlatformUserStats { total: number; active: number; inactive: number; orgs: number; }

export interface PlatformUserFilters { search?: string; role?: string; status?: string; reason?: string; organizationId?: string; schoolId?: string; }

export interface PlatformUserDirectory extends PaginatedResult<User> { stats: PlatformUserStats; }

export interface DirectoryItem {
  id: string;
  type: 'staff' | 'student';
  name: string;
  email: string | null;
  subtitle: string | null;
  status: string;
  avatarUrl?: string | null;
  organization: { id: string; name: string; logoUrl?: string | null } | null;
  branch: { id: string; name: string; code?: string; logoUrl?: string | null } | null;
  createdAt: string;
}

export interface PlatformDirectory extends PaginatedResult<DirectoryItem> {
  userTotal: number;
  studentTotal: number;
}

export interface DirectoryFilters {
  type?: string; search?: string; organizationId?: string; schoolId?: string;
  role?: string; status?: string; classId?: string; sectionId?: string;
}

export const staffService = {
  getAll: async (params?: { schoolId?: string; role?: string; page?: number; pageSize?: number }): Promise<PaginatedResult<User>> => {
    const res = await api.get<ApiResponse<PaginatedResult<User>>>('/auth/users', { params });
    return res.data.data;
  },

  getAllPlatform: async (params?: { page?: number; pageSize?: number } & PlatformUserFilters): Promise<PlatformUserDirectory> => {
    const res = await api.get<ApiResponse<PlatformUserDirectory>>('/auth/users/all', { params });
    return res.data.data;
  },

  getDirectory: async (params?: { page?: number; pageSize?: number } & DirectoryFilters): Promise<PlatformDirectory> => {
    const res = await api.get<ApiResponse<PlatformDirectory>>('/auth/users/directory', { params });
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

  createStudent: async (data: { schoolId: string; firstName: string; lastName: string; rollNumber: string; sectionId?: string; parentName?: string; parentWhatsappNo?: string; password?: string }): Promise<any> => {
    const res = await api.post<ApiResponse<any>>(`/students/schools/${data.schoolId}`, data);
    return res.data.data;
  },

  getById: async (id: string): Promise<User> => {
    const res = await api.get<ApiResponse<User>>(`/auth/users/${id}`);
    return res.data.data;
  },

  create: async (data: StaffCreatePayload): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/auth/users', data);
    return res.data.data;
  },

  createSample: async (): Promise<{ created: number; password: string; items: { name: string; email: string; username: string; role: string; classTeacher: string | null }[] }> => {
    const res = await api.post<ApiResponse<{ created: number; password: string; items: { name: string; email: string; username: string; role: string; classTeacher: string | null }[] }>>('/auth/users/sample');
    return res.data.data;
  },

  update: async (id: string, data: { name?: string; phone?: string; role?: string; email?: string; isActive?: boolean }): Promise<User> => {
    const res = await api.patch<ApiResponse<User>>(`/auth/users/${id}`, data);
    return res.data.data;
  },

  deactivate: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`/auth/users/${id}`, { data: reason ? { reason } : undefined });
  },

  reactivate: async (id: string): Promise<void> => {
    await api.patch(`/auth/users/${id}/reactivate`);
  },

  importExcel: async (file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData(); formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>('/auth/users/import', formData);
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

  getUnassignedAdmins: async (): Promise<{ id: string; name: string; email: string; organizationId: string | null }[]> => {
    const res = await api.get<ApiResponse<{ id: string; name: string; email: string; organizationId: string | null }[]>>('/auth/users/unassigned-admins');
    return res.data.data;
  },

  assignToBranch: async (adminId: string, schoolId: string): Promise<{ success: boolean; admin: { id: string; name: string; email: string }; replacedAdmin?: { id: string; name: string; email: string } | null }> => {
    const res = await api.post<ApiResponse<{ success: boolean; admin: { id: string; name: string; email: string }; replacedAdmin?: { id: string; name: string; email: string } | null }>>(`/auth/users/${adminId}/assign-branch`, { schoolId });
    return res.data.data;
  },
};
