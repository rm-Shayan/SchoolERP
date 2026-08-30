export interface BranchSecretsValues {
  smtpUsername: string;
  smtpPassword: string;
  cloudName: string;
  cloudApiKey: string;
  cloudApiSecret: string;
}

export interface BranchFormValues extends BranchSecretsValues {
  name: string;
  code: string;
  address: string;
  phone: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  existingAdminEmail: string;
}

export function hasBranchSmtp(v: BranchSecretsValues): boolean {
  return Boolean(v.smtpUsername?.trim() && v.smtpPassword?.replace(/\s+/g, ''));
}

export function hasBranchCloud(v: BranchSecretsValues): boolean {
  return Boolean(v.cloudName?.trim() && v.cloudApiKey?.trim() && v.cloudApiSecret?.trim());
}

// Naya admin → SMTP + Cloudinary required (koi previous account nahi jisse
// inherit kare). Existing admin → optional; provided field to wahi use honge.
export function branchCreatePayload(values: BranchFormValues, organizationId: string) {
  const existingEmail = values.existingAdminEmail?.trim();
  return {
    organizationId,
    name: values.name,
    code: values.code,
    address: values.address || undefined,
    phone: values.phone || undefined,
    ...(existingEmail
      ? { existingAdminEmail: existingEmail }
      : {
          adminEmail: values.adminEmail.trim(),
          adminName: values.adminName.trim() || undefined,
          adminPassword: values.adminPassword || undefined,
        }),
    ...(hasBranchSmtp(values)
      ? {
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            username: values.smtpUsername.trim().toLowerCase(),
            password: values.smtpPassword.replace(/\s+/g, ''),
          },
        }
      : {}),
    ...(hasBranchCloud(values)
      ? {
          cloudinary: {
            cloudName: values.cloudName.trim(),
            apiKey: values.cloudApiKey.trim(),
            apiSecret: values.cloudApiSecret.trim(),
          },
        }
      : {}),
  };
}