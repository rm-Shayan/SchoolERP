'use client';

import { Input, Select, Button } from '@/features/shared/components';
import type { SmtpSettingInfo } from '@/types';
import { type Scope, type Tier } from './smtpShared';

interface SmtpSettingsFormProps {
  values: Record<string, unknown>;
  errors: Record<string, string | undefined>;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBlur: (name: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  scope: Scope;
  setScope: (s: Scope) => void;
  tier: Tier;
  setTier: (t: Tier) => void;
  lockedBranch: boolean;
  existing: SmtpSettingInfo | null;
  testing: boolean;
  onTestSend: () => void;
  onRemove: () => void;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </section>
  );
}

export default function SmtpSettingsForm({
  values, errors, isSubmitting, handleChange, handleBlur, handleSubmit,
  scope, setScope, tier, setTier, lockedBranch, existing, testing, onTestSend, onRemove,
}: SmtpSettingsFormProps) {
  const v = values as Record<string, string>;
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Group title="Scope">
        <div className={`grid grid-cols-1 gap-4 ${lockedBranch ? '' : 'md:grid-cols-2'}`}>
          {!lockedBranch && (
            <Select label="Apply To" value={scope} onChange={(e) => setScope(e.target.value as Scope)}
              options={[{ value: 'organization', label: 'Organization Default' }, { value: 'branch', label: 'This Branch Only' }]} />
          )}
          <Select label="Tier" value={tier} onChange={(e) => setTier(e.target.value as Tier)}
            options={[{ value: 'PRIMARY', label: 'Primary' }, { value: 'SECONDARY', label: 'Secondary (Failover)' }]} />
        </div>
      </Group>

      <Group title="Connection">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(9rem,1fr)]">
          <Input label="SMTP Host" name="host" value={v.host} onChange={handleChange}
            onBlur={() => handleBlur('host')} error={errors.host} placeholder="smtp.gmail.com" required />
          <Input label="Port" name="port" value={v.port} onChange={handleChange}
            onBlur={() => handleBlur('port')} error={errors.port} inputMode="numeric" required />
        </div>
        <Input label="Username (Gmail)" name="username" type="email" value={v.username}
          onChange={handleChange} onBlur={() => handleBlur('username')} error={errors.username}
          placeholder="principal@gmail.com" required />
        <Input label={existing ? 'New App Password (blank = keep current)' : 'App Password'}
          name="password" type="password" value={v.password} onChange={handleChange}
          onBlur={() => handleBlur('password')} error={errors.password} placeholder="•••• •••• •••• ••••" />
      </Group>

      <Group title="Sending">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Select label="Security" value={v.secure} name="secure" onChange={handleChange}
            options={[{ value: 'false', label: 'STARTTLS (port 587)' }, { value: 'true', label: 'SSL/TLS (port 465)' }]} />
          <Input label="Display Name (optional)" name="fromName" value={v.fromName} onChange={handleChange}
            onBlur={() => handleBlur('fromName')} error={errors.fromName} placeholder="Oxford Group - Senior Campus" />
          <Select label="Daily Send Limit" name="dailyLimit" value={v.dailyLimit} onChange={handleChange}
            options={[{ value: '500', label: '500/day — Gmail free' }, { value: '2000', label: '2000/day — Workspace' }, { value: '3000', label: '3000/day' }, { value: '4000', label: '4000/day' }]} />
        </div>
        <p className="text-[11px] text-gray-400">
          Not sure if the account is free Gmail or Workspace? Keep 500/day — if it&apos;s wrong the system auto-detects, fails over, and shows a warning above.
        </p>
      </Group>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:flex-wrap sm:justify-end">
        {existing && <Button type="button" variant="danger" onClick={onRemove} className="w-full sm:w-auto">Remove</Button>}
        <Button type="button" variant="outline" loading={testing} onClick={onTestSend} className="w-full sm:w-auto">Send Test Email</Button>
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">Save &amp; Verify</Button>
      </div>
    </form>
  );
}
