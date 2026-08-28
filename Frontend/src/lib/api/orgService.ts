import api from './client';
import type { ApiResponse, Organization, OrgDashboard, PlatformOverview } from '@/types';

export interface OrgPublicBranch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
}

export interface OrgPublicData {
  id: string;
  name: string;
  code: string;
  slug: string;
  logoUrl: string | null;
  themeColor: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  branches: OrgPublicBranch[];
}

export interface OrgCreatePayload {
  name: string;
  code: string;
  slug?: string;
  logoUrl?: string;
  themeColor?: string;
  adminEmail?: string;
  adminName?: string;
  adminUsername?: string;
  adminPassword?: string;
  adminPhone?: string;
}

// POST /organizations/import-excel — SUPER_ADMIN
export const orgService = {
  // GET /organizations/public/:slug — PUBLIC (org landing page /o/:slug)
  getPublicBySlug: async (slug: string): Promise<OrgPublicData> => {
    const res = await api.get<ApiResponse<OrgPublicData>>(`/organizations/public/${slug}`);
    return res.data.data;
  },

  // POST /organizations/import-excel — SUPER_ADMIN
  importExcel: async (file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>(
      '/organizations/import-excel',
      formData
    );
    return res.data.data;
  },

  // GET /organizations/import-template — SUPER_ADMIN (blank Excel template for bulk import)
  downloadImportTemplate: async (): Promise<Blob> => {
    const res = await api.get<Blob>('/organizations/import-template', { responseType: 'blob' });
    return res.data;
  },

  // POST /organizations — SUPER_ADMIN
  create: async (data: OrgCreatePayload): Promise<{
    organization: Organization;
    defaultBranch?: { id: string; name: string; code: string } | null;
    adminCredentials: { email: string; password: string } | null;
    emailConfigured?: boolean;
  }> => {
    const res = await api.post<ApiResponse<{
      organization: Organization;
      defaultBranch?: { id: string; name: string; code: string } | null;
      adminCredentials: { email: string; password: string } | null;
      emailConfigured?: boolean;
    }>>('/organizations', data);
    return res.data.data;
  },

  // POST /organizations/logo — SUPER_ADMIN (upload org logo, returns URL)
  // Passing organizationId lets the backend overwrite the org's existing
  // Cloudinary asset (same public_id) instead of uploading a second file.
  uploadLogo: async (file: File, organizationId?: string): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (organizationId) formData.append('organizationId', organizationId);
    const res = await api.post<ApiResponse<{ url: string }>>('/organizations/logo', formData);
    return res.data.data;
  },

  // GET /organizations — SUPER_ADMIN
  getAll: async (): Promise<Organization[]> => {
    const res = await api.get<ApiResponse<Organization[]>>('/organizations');
    return res.data.data;
  },

  // GET /organizations/export — SUPER_ADMIN (Excel download of all organizations)
  exportExcel: async (): Promise<Blob> => {
    const res = await api.get<Blob>('/organizations/export', { responseType: 'blob' });
    return res.data;
  },

  // GET /organizations/overview — SUPER_ADMIN (single cached aggregate request)
  getOverview: async (): Promise<PlatformOverview> => {
    const res = await api.get<ApiResponse<PlatformOverview>>('/organizations/overview');
    return res.data.data;
  },

  // GET /organizations/:id — SUPER_ADMIN
  getById: async (id: string): Promise<Organization> => {
    const res = await api.get<ApiResponse<Organization>>(`/organizations/${id}`);
    return res.data.data;
  },

  // PATCH /organizations/:id — SUPER_ADMIN
  update: async (id: string, data: { name?: string; code?: string; logoUrl?: string; themeColor?: string; adminUsername?: string; phone?: string; email?: string; website?: string; facebookUrl?: string; instagramUrl?: string; twitterUrl?: string; youtubeUrl?: string; bankName?: string | null; bankAccountTitle?: string | null; bankAccountNumber?: string | null }): Promise<Organization> => {
    const res = await api.patch<ApiResponse<Organization>>(`/organizations/${id}`, data);
    return res.data.data;
  },

  // GET /organizations/:id/dashboard — SUPER_ADMIN (branch + revenue + staff drill-down)
  getDashboard: async (id: string): Promise<OrgDashboard> => {
    const res = await api.get<ApiResponse<OrgDashboard>>(`/organizations/${id}/dashboard`);
    return res.data.data;
  },

  // DELETE /organizations/:id — SUPER_ADMIN
  remove: async (id: string): Promise<void> => {
    await api.delete(`/organizations/${id}`);
  },
};
