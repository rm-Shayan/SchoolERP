import api from './client';
import type { ApiResponse } from '@/types';
import type {
  EmailTemplateListResult,
  EmailTemplatePreviewResult,
  EmailTemplateSaveResult,
} from '@/types/emailTemplates';

/**
 * Org-scoped customizable mail templates — Settings > Mail Templates.
 * Backend: /api/v1/email-templates — org owner / super admin only.
 */
export const emailTemplatesService = {
  list: async (organizationId?: string | null): Promise<EmailTemplateListResult> => {
    const params: Record<string, string> = {};
    if (organizationId) params.organizationId = organizationId;
    const res = await api.get<ApiResponse<EmailTemplateListResult>>('/email-templates', { params });
    return res.data.data;
  },

  getOne: async (organizationId: string | null, key: string): Promise<EmailTemplatePreviewResult> => {
    const params: Record<string, string> = {};
    if (organizationId) params.organizationId = organizationId;
    const res = await api.get<ApiResponse<EmailTemplatePreviewResult>>(`/email-templates/${key}`, { params });
    return res.data.data;
  },

  preview: async (
    organizationId: string | null,
    key: string,
    vars?: Record<string, string>,
    subject?: string,
    bodyHtml?: string
  ): Promise<EmailTemplatePreviewResult> => {
    const res = await api.post<ApiResponse<EmailTemplatePreviewResult>>(`/email-templates/${key}/preview`, {
      organizationId: organizationId || undefined,
      vars,
      subject,
      bodyHtml,
    });
    return res.data.data;
  },

  save: async (
    organizationId: string | null,
    key: string,
    payload: { subject: string; bodyHtml: string }
  ): Promise<EmailTemplateSaveResult> => {
    const res = await api.put<ApiResponse<EmailTemplateSaveResult>>(`/email-templates/${key}`, {
      organizationId: organizationId || undefined,
      subject: payload.subject,
      bodyHtml: payload.bodyHtml,
    });
    return res.data.data;
  },

  reset: async (organizationId: string | null, key: string): Promise<EmailTemplateSaveResult> => {
    const params: Record<string, string> = {};
    if (organizationId) params.organizationId = organizationId;
    const res = await api.delete<ApiResponse<EmailTemplateSaveResult>>(`/email-templates/${key}`, { params });
    return res.data.data;
  },
};