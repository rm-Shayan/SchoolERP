// Per-tenant outgoing mail (SMTP) settings — org/branch x PRIMARY/SECONDARY.
// Failover chain: Branch Primary -> Org Primary -> Org Secondary -> Platform env.

export interface SmtpSettingInfo {
  id: string;
  organizationId: string;
  schoolId: string | null;
  tier: 'PRIMARY' | 'SECONDARY';
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromName: string | null;
  /** Gmail free ~500/day, Workspace 2000+ — outbox isi se transport skip karta hai */
  dailyLimit?: number | null;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Ek scope ke dono tiers */
export interface SmtpTierPair {
  primary: SmtpSettingInfo | null;
  secondary: SmtpSettingInfo | null;
}

export interface SmtpSettingsStatus {
  /** Org-level defaults (schoolId null) */
  organization: SmtpTierPair;
  /** Branch-level overrides — sirf tab jab schoolId query mein diya ho */
  branch?: SmtpTierPair;
}

export interface SmtpSettingsPayload {
  organizationId?: string;
  schoolId?: string | null;
  tier?: 'PRIMARY' | 'SECONDARY';
  host: string;
  port?: number;
  secure?: boolean;
  username: string;
  /** Update par optional — khali chhodo to purana password rehta hai */
  password?: string;
  fromName?: string;
  /** Clamp 100..5000 backend par */
  dailyLimit?: number;
}

export interface SmtpTestResult {
  sentTo: string;
  fromName: string;
  fromEmail: string;
}
