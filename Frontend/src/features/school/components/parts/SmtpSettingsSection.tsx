'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, composeValidators, required, isEmail, positiveNumber } from '@/lib/utils';
import { smtpSettingsService, schoolService, orgService } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { Card } from '@/features/shared/components';
import type { SmtpSettingsStatus, SmtpSettingInfo } from '@/types';
import toast from 'react-hot-toast';
import SmtpStatusChips from './SmtpStatusChips';
import SmtpQueuedMailWarning from './SmtpQueuedMailWarning';
import SmtpSettingsForm from './SmtpSettingsForm';
import CredentialsSectionToggle from './CredentialsSectionToggle';
import { pickExisting, type Tier } from './smtpShared';

interface SmtpSettingsSectionProps {
  /** Super-admin override — manage settings for any organization */
  organizationId?: string;
  /** Branch-specific mode — locked to this branch (branch selector hidden) */
  schoolId?: string;
}

export default function SmtpSettingsSection({ organizationId: orgProp, schoolId: schoolProp }: SmtpSettingsSectionProps) {
  const { user, school } = useAppSelector((st) => st.auth);
  const orgId = orgProp ?? user?.organizationId ?? null;
  const lockedBranch = Boolean(schoolProp);
  /** Locked views fall back to the viewer's own branch; super admin picks one. */
  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    schoolProp ?? (!lockedBranch ? null : (user?.schoolId ?? school?.id ?? null))
  );
  const branchId = schoolProp ?? selectedBranch;
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [orgName, setOrgName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [status, setStatus] = useState<SmtpSettingsStatus | null>(null);
  const [tier, setTier] = useState<Tier>('PRIMARY');
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    if (!orgId || !branchId) { setStatus(null); return; }
    try { setStatus(await smtpSettingsService.getStatus(orgId, branchId)); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'SMTP settings load failed'); }
  }, [orgId, branchId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!orgId) return;
    orgService.getById(orgId).then((o) => setOrgName(o.name)).catch(() => {});
    if (!lockedBranch) schoolService.getAll(orgId).then((s) => setBranches(s.map((b) => ({ id: b.id, name: b.name })))).catch(() => {});
    else if (branchId) schoolService.getById(branchId).then((s) => setBranchName(s.name)).catch(() => {});
  }, [orgId, lockedBranch, branchId]);
  const existingRef = useRef<SmtpSettingInfo | null>(null);
  existingRef.current = useMemo(() => pickExisting(status, tier), [status, tier]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, reset } = useForm({
    initialValues: { host: 'smtp.gmail.com', port: '587', secure: 'false', username: '', password: '', fromName: '', dailyLimit: '500' },
    validators: {
      host: required('Host is required'),
      port: composeValidators(required('Port is required'), positiveNumber('Port must be a positive number')),
      username: composeValidators(required('Username email is required'), isEmail('Enter a valid email')),
      password: (v) => (!existingRef.current && !String(v || '').trim() ? 'App Password required for first-time setup' : undefined),
    },
    onSubmit: async (v) => {
      if (!branchId) { toast.error('Select a branch first'); return; }
      try {
        await smtpSettingsService.save({ organizationId: orgId || undefined, schoolId: branchId, tier,
          host: v.host as string, port: Number(v.port), secure: v.secure === 'true', username: v.username as string,
          ...(String(v.password).trim() ? { password: v.password as string } : {}),
          fromName: String(v.fromName || '').trim() || undefined, dailyLimit: Number(v.dailyLimit) || 500 });
        toast.success('SMTP settings saved & verified'); reset(); await load();
      } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to save SMTP settings'); }
    },
  });

  const onTestSend = async () => {
    if (!branchId) { toast.error('Select a branch first'); return; }
    setTesting(true);
    try {
      const r = await smtpSettingsService.sendTestEmail(orgId, branchId);
      toast.success(`Test email sent to ${r.sentTo}`);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Test email failed'); } finally { setTesting(false); }
  };
  const onRemove = async () => {
    if (!branchId) return;
    try {
      await smtpSettingsService.remove(orgId, branchId, tier);
      toast.success('SMTP settings removed');
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Remove failed'); }
  };
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CredentialsSectionToggle
        open={open}
        onToggle={() => setOpen((o) => !o)}
        title="Email Sending (SMTP)"
        subtitle="This branch&apos;s outgoing mail, credentials and failover"
        iconPaths={['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z']}
        showStatus={Boolean(branchId)}
        status={<SmtpStatusChips status={status} />}
      />
      {branchId && <SmtpQueuedMailWarning queuedMail={status?.queuedMail} scopeLabel={branchName || 'this branch'} />}
      {open && (
        <div className="space-y-6 border-t border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-6 sm:py-6">
          <div className="rounded-xl border border-primary-200 bg-white p-3 shadow-sm">
            <p className="text-xs text-primary-700 font-medium">Tip: Google Account → Security → 2-Step Verification → App Passwords → Mail → copy 16-char code below.</p>
          </div>
          {!branchId && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
              SMTP credentials ek branch ki hoti hain — upar se branch choose karein.
            </p>
          )}
          {branchId && (
            <SmtpSettingsForm
              values={values} errors={errors} isSubmitting={isSubmitting}
              handleChange={handleChange} handleBlur={handleBlur} handleSubmit={handleSubmit}
              tier={tier} setTier={setTier} lockedBranch={lockedBranch}
              existing={existingRef.current} testing={testing}
              onTestSend={onTestSend} onRemove={onRemove}
              orgName={orgName} branchName={branchName}
              branches={branches} selectedBranch={branchId} onBranchChange={setSelectedBranch}
            />
          )}
        </div>
      )}
    </Card>
  );
}