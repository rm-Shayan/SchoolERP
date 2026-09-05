import api from './client';
import type { ApiResponse, Organization, OrgDashboard, PlatformOverview } from '@/types';

export interface OrgPublicBranch { id: string; name: string; code: string; address: string | null; phone: string | null; logoUrl: string | null; }

export interface OrgPublicData {
  id: string; name: string; code: string; slug: string; logoUrl: string | null;
  themeColor: string; phone: string | null; email: string | null; website: string | null;
  facebookUrl: string | null; instagramUrl: string | null; twitterUrl: string | null;
  youtubeUrl: string | null; branches: OrgPublicBranch[];
}

export interface HealthBranch { id: string; name: string; code: string; status?: string; blockedReason?: string | null; blockedByName?: string | null; organization?: { id: string; name: string }; }

export interface PlatformHealthData { blocked: HealthBranch[]; noAdmin: HealthBranch[]; noStaff: HealthBranch[]; emptyOrgs: { id: string; name: string; code: string }[]; }

export interface OrgCreatePayload {
  name: string; code: string; slug?: string; logoUrl?: string; themeColor?: string;
  adminEmail?: string; adminName?: string; adminUsername?: string; adminPassword?: string;
  adminPhone?: string; existingAdminEmail?: string;
}

export const orgService = {
  getPublicBySlug: async (slug: string): Promise<OrgPublicData> => {
    const res = await api.get<ApiResponse<OrgPublicData>>(`/organizations/public/${slug}`);
    return res.data.data;
  },
  importExcel: async (file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData(); formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>('/organizations/import-excel', formData);
    return res.data.data;
  },
  downloadImportTemplate: async (): Promise<Blob> => {
    const res = await api.get<Blob>('/organizations/import-template', { responseType: 'blob' });
    return res.data;
  },
  create: async (data: OrgCreatePayload): Promise<{ organization: Organization; defaultBranch?: { id: string; name: string; code: string } | null; adminCredentials: { email: string; password: string } | null; emailConfigured?: boolean }> => {
    const res = await api.post<ApiResponse<{ organization: Organization; defaultBranch?: { id: string; name: string; code: string } | null; adminCredentials: { email: string; password: string } | null; emailConfigured?: boolean }>>('/organizations', data);
    return res.data.data;
  },
  uploadLogo: async (file: File, organizationId?: string): Promise<{ url: string }> => {
    const formData = new FormData(); formData.append('file', file);
    if (organizationId) formData.append('organizationId', organizationId);
    const res = await api.post<ApiResponse<{ url: string }>>('/organizations/logo', formData);
    return res.data.data;
  },
  getAll: async (): Promise<Organization[]> => {
    const res = await api.get<ApiResponse<Organization[]>>('/organizations');
    return res.data.data;
  },
  exportExcel: async (): Promise<Blob> => {
    const res = await api.get<Blob>('/organizations/export', { responseType: 'blob' });
    return res.data;
  },
  getOverview: async (): Promise<PlatformOverview> => {
    const res = await api.get<ApiResponse<PlatformOverview>>('/organizations/overview');
    return res.data.data;
  },
  getHealth: async (): Promise<PlatformHealthData> => {
    const res = await api.get<ApiResponse<PlatformHealthData>>('/organizations/health');
    return res.data.data;
  },
  getById: async (id: string): Promise<Organization> => {
    const res = await api.get<ApiResponse<Organization>>(`/organizations/${id}`);
    return res.data.data;
  },
  update: async (id: string, data: { name?: string; code?: string; logoUrl?: string; themeColor?: string; adminUsername?: string; phone?: string; email?: string; website?: string; facebookUrl?: string; instagramUrl?: string; twitterUrl?: string; youtubeUrl?: string; bankName?: string | null; bankAccountTitle?: string | null; bankAccountNumber?: string | null }): Promise<Organization> => {
    const res = await api.patch<ApiResponse<Organization>>(`/organizations/${id}`, data);
    return res.data.data;
  },
  getDashboard: async (id: string): Promise<OrgDashboard> => {
    const res = await api.get<ApiResponse<OrgDashboard>>(`/organizations/${id}/dashboard`);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => { await api.delete(`/organizations/${id}`); },
};
