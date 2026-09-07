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

// New admin → SMTP + Cloudinary required (no previous account to inherit from).
// Existing admin → optional; provided fields will be used as-is.
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