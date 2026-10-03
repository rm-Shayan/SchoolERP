import type { SmtpSettingsStatus, SmtpSettingInfo } from '@/types';

export type Tier = 'PRIMARY' | 'SECONDARY';

/** Credentials are per-branch, so only the tier is being picked. */
export const pickExisting = (s: SmtpSettingsStatus | null, tier: Tier): SmtpSettingInfo | null =>
  (tier === 'PRIMARY' ? s?.branch?.primary : s?.branch?.secondary) ?? null;