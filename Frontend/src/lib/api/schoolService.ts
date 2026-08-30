import api from './client';
import type { ApiResponse, School, SchoolBranding } from '@/types';

export interface SchoolCreatePayload {
  organizationId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  // Har branch ka apna ADMIN (Principal) hota hai — adminEmail zaroori hai.
  adminEmail?: string;
  adminName?: string;
  adminPassword?: string;
  // Same org ka existing ADMIN — no new credentials; wo account is branch ko
  // bhi manage karega (Settings → My Branches se switch karega).
  existingAdminEmail?: string;
  // Naya admin → required; existing admin → optional (inherit hota hai).
  smtp?: { host: string; port: number; secure: boolean; username: string; password: string };
  cloudinary?: { cloudName: string; apiKey: string; apiSecret: string };
}

export interface SchoolAdminRef {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SchoolCreateResult {
  school: School;
  admin?: SchoolAdminRef | null;
  adminCredentials?: { email: string; password: string } | null;
  smtpSetting?: unknown;
  cloudinarySetting?: unknown;
}

export interface SchoolAdminAssignPayload {
  adminEmail?: string;
  adminName?: string;
  adminPassword?: string;
  // Existing ADMIN mode — same account (no new credentials / no deactivation).
  existingAdminEmail?: string;
}

export interface SchoolAdminAssignResult {
  admin?: SchoolAdminRef | null;
  adminCredentials?: { email: string; password: string } | null;
}

export const schoolService = {
  // GET /schools — MANAGEMENT
  getAll: async (organizationId?: string): Promise<School[]> => {
    const params = organizationId ? { organizationId } : {};
    const res = await api.get<ApiResponse<School[]>>('/schools', { params });
    return res.data.data;
  },

  // POST /schools/import-excel — SUPER_ADMIN (branch bulk import)
  importExcel: async (file: File, organizationId?: string): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (organizationId) formData.append('organizationId', organizationId);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>(
      '/schools/import-excel',
      formData
    );
    return res.data.data;
  },

  // GET /schools/export?organizationId=... — SUPER_ADMIN (Excel download of branches)
  exportExcel: async (organizationId?: string): Promise<Blob> => {
    const params = organizationId ? { organizationId } : {};
    const res = await api.get<Blob>('/schools/export', { params, responseType: 'blob' });
    return res.data;
  },

  // GET /schools/import-template — SUPER_ADMIN (blank Excel template for bulk import)
  downloadImportTemplate: async (): Promise<Blob> => {
    const res = await api.get<Blob>('/schools/import-template', { responseType: 'blob' });
    return res.data;
  },

  // GET /schools/branding?code=XYZ OR ?slug=gulshan — PUBLIC (used on the login screen)
  getBranding: async (params: { code?: string; slug?: string }): Promise<SchoolBranding> => {
    const res = await api.get<ApiResponse<SchoolBranding>>('/schools/branding', { params });
    return res.data.data;
  },

  // GET /schools/:id — MANAGEMENT
  getById: async (id: string): Promise<School> => {
    const res = await api.get<ApiResponse<School>>(`/schools/${id}`);
    return res.data.data;
  },

  // POST /schools — MANAGEMENT
  create: async (data: SchoolCreatePayload): Promise<SchoolCreateResult> => {
    const res = await api.post<ApiResponse<SchoolCreateResult>>('/schools', data);
    return res.data.data;
  },

  // PATCH /schools/:id — MANAGEMENT
  update: async (id: string, data: { name?: string; code?: string; address?: string; phone?: string; logoUrl?: string | null; themeColor?: string | null; attendanceStartTime?: string; attendanceCutoffTime?: string; attendanceAbsentTime?: string; attendanceAlertTime?: string; bankName?: string | null; bankAccountTitle?: string | null; bankAccountNumber?: string | null }): Promise<School> => {
    const res = await api.patch<ApiResponse<School>>(`/schools/${id}`, data);
    return res.data.data;
  },

  // PATCH /schools/:id/admin — SUPER_ADMIN (re-assign branch admin)
  assignAdmin: async (id: string, data: SchoolAdminAssignPayload): Promise<SchoolAdminAssignResult> => {
    const res = await api.patch<ApiResponse<SchoolAdminAssignResult>>(`/schools/${id}/admin`, data);
    return res.data.data;
  },

  // POST /schools/logo — MANAGEMENT (upload branch logo, returns URL)
  // Passing schoolId lets the backend overwrite the branch's existing
  // Cloudinary asset (same public_id) instead of uploading a second file.
  uploadLogo: async (file: File, schoolId?: string): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (schoolId) formData.append('schoolId', schoolId);
    const res = await api.post<ApiResponse<{ url: string }>>('/schools/logo', formData);
    return res.data.data;
  },

  // DELETE /schools/:id — SUPER_ADMIN
  remove: async (id: string): Promise<void> => {
    await api.delete(`/schools/${id}`);
  },

  // GET /schools/:id/portal-password — status of the shared parent/student password
  getPortalPasswordStatus: async (id: string): Promise<{ hasCustomPassword: boolean; schoolCode: string }> => {
    const res = await api.get<ApiResponse<{ hasCustomPassword: boolean; schoolCode: string }>>(`/schools/${id}/portal-password`);
    return res.data.data;
  },

  // PUT /schools/:id/portal-password — MANAGEMENT (set shared parent/student portal password)
  setPortalPassword: async (id: string, password: string): Promise<boolean> => {
    const res = await api.put<ApiResponse<boolean>>(`/schools/${id}/portal-password`, { password });
    return res.data.data;
  },

  // DELETE /schools/:id/portal-password — back to default (school code)
  resetPortalPassword: async (id: string): Promise<boolean> => {
    const res = await api.delete<ApiResponse<boolean>>(`/schools/${id}/portal-password`);
    return res.data.data;
  },
};
