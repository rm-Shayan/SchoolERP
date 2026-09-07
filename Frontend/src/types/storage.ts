// Per-tenant media storage (Cloudinary) credentials.
// Row present = org uploads to their own account; row absent = platform.

export interface StorageSettingInfo {
  id: string;
  organizationId: string;
  provider: string;
  cloudName: string;
  apiKey: string;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageSettingsStatus {
  /** "organization" = org's own credentials, "platform" = super admin fallback */
  source: 'organization' | 'platform';
  setting: StorageSettingInfo | null;
}

export interface StorageSettingsPayload {
  organizationId?: string;
  schoolId?: string | null;
  cloudName: string;
  apiKey: string;
  /** Optional on update — leave empty to keep the existing secret */
  apiSecret?: string;
}
