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
import CredentialsSectionToggle from './CredentialsSectionToggle';

interface StorageSettingsSectionProps {
  organizationId?: string;
  schoolId?: string;
}

export default function StorageSettingsSection({ organizationId: orgProp, schoolId: schoolProp }: StorageSettingsSectionProps = {}) {
  const { user, school } = useAppSelector((st) => st.auth);
  const orgId = orgProp ?? user?.organizationId ?? null;
  const lockedBranch = Boolean(schoolProp);
  const [branchId, setBranchId] = useState<string | null>(
    schoolProp ?? (!lockedBranch ? null : (user?.schoolId ?? school?.id ?? null))
  );
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [status, setStatus] = useState<StorageSettingsStatus | null>(null);
  const [orgName, setOrgName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const existingRef = useRef(false);

  const load = useCallback(async () => {
    if (!orgId || !branchId) { setStatus(null); return; }
    try {
      const s = await storageSettingsService.getStatus(orgId, branchId);
      existingRef.current = Boolean(s.branch);
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
      if (!branchId) { toast.error('Select a branch first'); return; }
      try {
        await storageSettingsService.save({
          organizationId: orgId || undefined,
          schoolId: branchId,
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
    if (status?.branch) {
      setValue('cloudName', status.branch.cloudName ?? '');
      setValue('apiKey', status.branch.apiKey ?? '');
    }
  }, [status, setValue]);

  const onVerify = async () => {
    if (!branchId) { toast.error('Select a branch first'); return; }
    setVerifying(true);
    try {
      await storageSettingsService.save({
        organizationId: orgId || undefined,
        schoolId: branchId,
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
    if (!branchId) return;
    try {
      await storageSettingsService.remove(orgId, branchId);
      toast.success('Storage settings removed — platform storage active');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Remove failed');
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CredentialsSectionToggle
        open={open}
        onToggle={() => setOpen((o) => !o)}
        title="Media Storage (Cloudinary)"
        subtitle="Photos, documents, and uploads storage configuration"
        iconPaths={['M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1H3V7z', 'M3 13h18v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z']}
        showStatus={Boolean(branchId)}
        status={<StorageStatusChips status={status} />}
      />

      {open && (
        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-6 sm:py-6">
          {!lockedBranch && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Configure for</label>
              <select value={branchId ?? ''} onChange={(e) => setBranchId(e.target.value || null)} className="w-full sm:w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                <option value="">Choose a branch…</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">Har branch ki apni storage hoti hai — kisi doosri branch ki use nahi.</p>
            </div>
          )}
          {branchId && (
            <StorageSettingsForm values={values} errors={errors} isSubmitting={isSubmitting} verifying={verifying} isOwn={status?.active === 'branch'} setting={status?.branch ?? null} existingCreds={existingRef.current} handleChange={handleChange} handleBlur={handleBlur} handleSubmit={handleSubmit} onVerify={onVerify} onRemove={onRemove} orgName={orgName} branchName={branchName} lockedBranch={lockedBranch} />
          )}
        </div>
      )}
    </Card>
  );
}
