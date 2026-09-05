// Per-tenant media storage (Cloudinary) credentials.
// Row mojood = org apne account par upload karta hai; row absent = platform.

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
  /** "organization" = org ke apne creds, "platform" = super admin fallback */
  source: 'organization' | 'platform';
  setting: StorageSettingInfo | null;
}

export interface StorageSettingsPayload {
  organizationId?: string;
  schoolId?: string | null;
  cloudName: string;
  apiKey: string;
  /** Update par optional — khali chhodo to purana secret rehta hai */
  apiSecret?: string;
}
