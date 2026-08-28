import type { SmtpSettingsStatus, SmtpSettingInfo } from '@/types';

export type Scope = 'organization' | 'branch';
export type Tier = 'PRIMARY' | 'SECONDARY';

export const pickExisting = (s: SmtpSettingsStatus | null, scope: Scope, tier: Tier): SmtpSettingInfo | null => {
  const pair = scope === 'organization' ? s?.organization : s?.branch;
  return (tier === 'PRIMARY' ? pair?.primary : pair?.secondary) ?? null;
};
