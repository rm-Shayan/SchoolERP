'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, required } from '@/lib/utils';
import { storageSettingsService, schoolService, orgService } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { Card } from '@/features/shared/components';
import type { StorageSettingsStatus } from '@/types';
import toast from 'react-hot-toast';
import StorageStatusChips from './StorageStatusChips';
import StorageSettingsForm from './StorageSettingsForm';

interface StorageSettingsSectionProps {
  organizationId?: string;
  schoolId?: string;
}

export default function StorageSettingsSection({ organizationId: orgProp, schoolId: schoolProp }: StorageSettingsSectionProps = {}) {
  const { user } = useAppSelector((st) => st.auth);
  const orgId = orgProp ?? user?.organizationId ?? null;
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState<string | null>(schoolProp ?? null);
  const lockedBranch = Boolean(schoolProp);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [status, setStatus] = useState<StorageSettingsStatus | null>(null);
  const [orgName, setOrgName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const existingRef = useRef(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      const s = await storageSettingsService.getStatus(orgId, branchId ?? undefined);
      existingRef.current = s.source === 'organization' && Boolean(s.setting);
      setStatus(s);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Storage settings load failed'); }
  }, [orgId, branchId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!orgId) return;
    orgService.getById(orgId).then((o) => setOrgName(o.name)).catch(() => {});
    if (lockedBranch && branchId) {
      schoolService.getById(branchId).then((s) => setBranchName(s.name)).catch(() => {});
    }
    if (!lockedBranch) {
      schoolService.getAll(orgId).then((s) => setBranches(s.map((b) => ({ id: b.id, name: b.name })))).catch(() => {});
    }
  }, [orgId, lockedBranch, branchId]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, reset, setValue } = useForm({
    initialValues: { cloudName: '', apiKey: '', apiSecret: '' },
    validators: {
      cloudName: required('Cloud name is required'),
      apiKey: required('API key is required'),
      apiSecret: (v) => (!existingRef.current && !String(v || '').trim() ? 'API secret required for first-time setup' : undefined),
    },
    onSubmit: async (v) => {
      try {
        await storageSettingsService.save({
          organizationId: orgId || undefined,
          schoolId: branchId || null,
          cloudName: String(v.cloudName).trim(),
          apiKey: String(v.apiKey).trim(),
          ...(String(v.apiSecret).trim() ? { apiSecret: v.apiSecret as string } : {}),
        });
        toast.success('Storage settings saved & verified');
        reset();
        await load();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to save storage settings');
      }
    },
  });

  useEffect(() => {
    if (status?.source === 'organization' && status.setting) {
      setValue('cloudName', status.setting.cloudName ?? '');
      setValue('apiKey', status.setting.apiKey ?? '');
    }
  }, [status, setValue]);

  const onVerify = async () => {
    setVerifying(true);
    try {
      await storageSettingsService.save({
        organizationId: orgId || undefined,
        cloudName: values.cloudName as string,
        apiKey: values.apiKey as string,
      });
      toast.success('Connection verified successfully');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Verification failed');
    } finally { setVerifying(false); }
  };

  const onRemove = async () => {
    try {
      await storageSettingsService.remove(orgId, branchId ?? undefined);
      toast.success('Storage settings removed — platform storage active');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Remove failed');
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full bg-gradient-to-r from-slate-50 to-white px-4 py-4 text-left transition-colors hover:from-primary-50/60 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-200 sm:h-12 sm:w-12">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1H3V7z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h18v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">Media Storage (Cloudinary)</h3>
            <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">Photos, documents, and uploads storage configuration</p>
          </div>
          <svg className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="mt-4 border-t border-slate-200/80 pt-4 sm:ml-16">
          <StorageStatusChips status={status} />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-6 sm:py-6">
          {!lockedBranch && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Configure for</label>
              <select value={branchId ?? ''} onChange={(e) => setBranchId(e.target.value || null)} className="w-full sm:w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                <option value="">Organization (all branches)</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">Leave empty for org-level settings</p>
            </div>
          )}
          <StorageSettingsForm values={values} errors={errors} isSubmitting={isSubmitting} verifying={verifying} isOwn={status?.source === 'organization'} setting={status?.setting ?? null} existingCreds={existingRef.current} handleChange={handleChange} handleBlur={handleBlur} handleSubmit={handleSubmit} onVerify={onVerify} onRemove={onRemove} orgName={orgName} branchName={branchName} branches={branches} selectedBranch={branchId} onBranchChange={(id) => { setBranchId(id); }} lockedBranch={lockedBranch} />
        </div>
      )}
    </Card>
  );
}
