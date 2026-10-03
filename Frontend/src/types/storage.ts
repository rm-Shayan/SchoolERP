// Per-branch media storage (Cloudinary) credentials.
// Row present = this branch uploads to its own account; row absent = platform.
// Credentials are never shared with another branch of the same organization.

export interface StorageSettingInfo {
  id: string;
  organizationId: string;
  /** Branch that owns these credentials (never null) */
  schoolId: string;
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
  /** This branch's own credentials — null when the platform storage is active */
  branch: StorageSettingInfo | null;
  /** Which credentials are actually in use for this branch */
  active: 'branch' | 'platform';
}

export interface StorageSettingsPayload {
  organizationId?: string;
  /** Required — credentials always belong to a branch */
  schoolId?: string | null;
  cloudName: string;
  apiKey: string;
  /** Optional on update — leave empty to keep the existing secret */
  apiSecret?: string;
}