import type { OrgCreateValues } from './orgForm';

export interface CreateOrgPayload {
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
  existingAdminEmail?: string;
  smtp?: { host: string; port: number; secure: boolean; username: string; password: string };
  bankName?: string;
  bankAccountTitle?: string;
  bankAccountNumber?: string;
  cloudinary?: { cloudName: string; apiKey: string; apiSecret: string };
}

export function toCreatePayload(v: OrgCreateValues): CreateOrgPayload {
  const su = v.smtpUsername?.trim();
  const sp = v.smtpPassword?.replace(/\s+/g, '');
  const cn = v.cloudName?.trim();
  const ck = v.cloudApiKey?.trim();
  const cs = v.cloudApiSecret?.trim();
  return {
    name: v.name,
    code: v.code,
    slug: v.slug || undefined,
    logoUrl: v.logoUrl || undefined,
    themeColor: v.themeColor || undefined,
    adminEmail: v.adminEmail.trim(),
    adminName: v.adminName.trim(),
    adminUsername: v.adminUsername || undefined,
    adminPassword: v.adminPassword,
    adminPhone: v.adminPhone || undefined,
    bankName: v.bankName.trim(),
    bankAccountTitle: v.bankAccountTitle.trim(),
    bankAccountNumber: v.bankAccountNumber.trim(),
    ...(su && sp
      ? { smtp: { host: 'smtp.gmail.com', port: 587, secure: false, username: su.toLowerCase(), password: sp } }
      : {}),
    ...(cn && ck && cs
      ? { cloudinary: { cloudName: cn, apiKey: ck, apiSecret: cs } }
      : {}),
  };
}

export function toSimpleCreatePayload(v: OrgCreateValues): Omit<CreateOrgPayload, 'adminUsername'> {
  const { adminUsername, ...rest } = toCreatePayload(v);
  void adminUsername;
  return rest;
}
