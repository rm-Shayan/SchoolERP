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
  /** Gmail free ~500/day, Workspace 2000+ — outbox uses this to skip transport */
  dailyLimit?: number | null;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Both tiers for a single scope */
export interface SmtpTierPair {
  primary: SmtpSettingInfo | null;
  secondary: SmtpSettingInfo | null;
}

export interface SmtpSettingsStatus {
  /** Org-level defaults (schoolId null) */
  organization: SmtpTierPair;
  /** Branch-level overrides — only when schoolId is provided in query */
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
  /** Optional on update — leave empty to keep the existing password */
  password?: string;
  fromName?: string;
  /** Clamped to 100..5000 on the backend */
  dailyLimit?: number;
}

export interface SmtpTestResult {
  sentTo: string;
  fromName: string;
  fromEmail: string;
}
