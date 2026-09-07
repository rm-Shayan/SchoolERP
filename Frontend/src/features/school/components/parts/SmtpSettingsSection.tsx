'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, composeValidators, required, isEmail, positiveNumber } from '@/lib/utils';
import { smtpSettingsService, schoolService, orgService } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { Card } from '@/features/shared/components';
import type { SmtpSettingsStatus, SmtpSettingInfo } from '@/types';
import toast from 'react-hot-toast';
import SmtpStatusChips from './SmtpStatusChips';
import SmtpSettingsForm from './SmtpSettingsForm';
import { pickExisting, type Scope, type Tier } from './smtpShared';

interface SmtpSettingsSectionProps {
  /** Super-admin override — manage settings for any organization */
  organizationId?: string;
  /** Branch-specific mode — locked to this branch (Apply To selector hidden) */
  schoolId?: string;
}

export default function SmtpSettingsSection({ organizationId: orgProp, schoolId: schoolProp }: SmtpSettingsSectionProps) {
  const { user, school } = useAppSelector((st) => st.auth);
  const orgId = orgProp ?? user?.organizationId ?? null;
  const branchId = schoolProp ?? user?.schoolId ?? school?.id ?? null;
  const lockedBranch = Boolean(schoolProp);
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(schoolProp ?? null);
  const [orgName, setOrgName] = useState('');
  const [branchName, setBranchName] = useState('');

  const [status, setStatus] = useState<SmtpSettingsStatus | null>(null);
  const [scope, setScope] = useState<Scope>(lockedBranch ? 'branch' : 'organization');
  const [tier, setTier] = useState<Tier>('PRIMARY');
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    try { setStatus(await smtpSettingsService.getStatus(orgId, branchId)); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'SMTP settings load failed'); }
  }, [orgId, branchId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!orgId) return;
    orgService.getById(orgId).then((o) => setOrgName(o.name)).catch(() => {});
    if (lockedBranch && branchId) schoolService.getById(branchId).then((s) => setBranchName(s.name)).catch(() => {});
    if (!lockedBranch) schoolService.getAll(orgId).then((s) => setBranches(s.map((b) => ({ id: b.id, name: b.name })))).catch(() => {});
  }, [orgId, lockedBranch, branchId]);
  const existingRef = useRef<SmtpSettingInfo | null>(null);
  existingRef.current = pickExisting(status, scope, tier);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, reset } = useForm({
    initialValues: { host: 'smtp.gmail.com', port: '587', secure: 'false', username: '', password: '', fromName: '', dailyLimit: '500' },
    validators: {
      host: required('Host is required'),
      port: composeValidators(required('Port is required'), positiveNumber('Port must be a positive number')),
      username: composeValidators(required('Username email is required'), isEmail('Enter a valid email')),
      password: (v) => (!existingRef.current && !String(v || '').trim() ? 'App Password required for first-time setup' : undefined),
    },
    onSubmit: async (v) => {
      try {
        await smtpSettingsService.save({ organizationId: orgId || undefined, schoolId: effectiveBranchId, tier,
          host: v.host as string, port: Number(v.port), secure: v.secure === 'true', username: v.username as string,
          ...(String(v.password).trim() ? { password: v.password as string } : {}),
          fromName: String(v.fromName || '').trim() || undefined, dailyLimit: Number(v.dailyLimit) || 500 });
        toast.success('SMTP settings saved & verified'); reset(); await load();
      } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to save SMTP settings'); }
    },
  });
  const effectiveBranchId = lockedBranch ? branchId : (scope === 'branch' ? selectedBranch : null);

  const onTestSend = async () => {
    setTesting(true);
    try {
      const r = await smtpSettingsService.sendTestEmail(orgId, effectiveBranchId);
      toast.success(`Test email sent to ${r.sentTo}`);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Test email failed'); } finally { setTesting(false); }
  };
  const onRemove = async () => {
    try {
      await smtpSettingsService.remove(orgId, effectiveBranchId, tier);
      toast.success('SMTP settings removed');
      await load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Remove failed'); }
  };
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full bg-gradient-to-r from-slate-50 to-white px-4 py-4 text-left transition-colors hover:from-primary-50/60 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-200 sm:h-12 sm:w-12">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">Email Sending (SMTP)</h3>
            <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">{lockedBranch ? 'Branch outgoing email configuration' : 'Outgoing mail, credentials and failover settings'}</p>
          </div>
          <svg className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="mt-4 border-t border-slate-200/80 pt-4 sm:ml-16">
          <SmtpStatusChips status={status} />
        </div>
      </button>
      {open && (
        <div className="space-y-6 border-t border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-6 sm:py-6">
          <div className="rounded-xl border border-primary-200 bg-white p-3 shadow-sm">
            <p className="text-xs text-primary-700 font-medium">Tip: Google Account → Security → 2-Step Verification → App Passwords → Mail → copy 16-char code below.</p>
          </div>
          {!lockedBranch && scope === 'branch' && (
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Select Branch</label>
              <select value={selectedBranch ?? ''} onChange={(e) => setSelectedBranch(e.target.value || null)} className="w-full sm:w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                <option value="">Choose a branch…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <SmtpSettingsForm
            values={values}
            errors={errors}
            isSubmitting={isSubmitting}
            handleChange={handleChange}
            handleBlur={handleBlur}
            handleSubmit={handleSubmit}
            scope={scope}
            setScope={setScope}
            tier={tier}
            setTier={setTier}
            lockedBranch={lockedBranch}
            existing={existingRef.current}
            testing={testing}
            onTestSend={onTestSend}
            onRemove={onRemove}
            orgName={orgName}
            branchName={branchName}
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
          />
        </div>
      )}
    </Card>
  );
}
