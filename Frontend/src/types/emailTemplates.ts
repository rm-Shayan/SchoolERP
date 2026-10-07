export interface EmailTemplateMeta {
  key: string;
  label: string;
  description: string;
  placeholders: string[];
  defaultSubject: string;
  subject: string | null;
  bodyHtml: string | null;
  isCustomized: boolean;
  updatedAt: string | null;
}

export interface EmailTemplateListResult {
  organizationId: string;
  templates: EmailTemplateMeta[];
}

export interface EmailTemplatePreviewResult {
  key: string;
  label: string;
  placeholders: string[];
  defaultSubject: string;
  subject: string | null;
  bodyHtml: string | null;
  renderedSubject: string;
  renderedBody: string | null;
  isCustomized: boolean;
  vars: Record<string, string>;
}

export interface EmailTemplateSaveResult {
  key: string;
  subject: string | null;
  bodyHtml: string | null;
  isCustomized: boolean;
}