'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, required } from '@/lib/utils';
import { storageSettingsService } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { Input, Button } from '@/features/shared/components';
import type { StorageSettingsStatus } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const maskKey = (key?: string | null) => {
  const k = String(key ?? '');
  if (k.length <= 8) return '••••••••';
  return `${k.slice(0, 4)}${'•'.repeat(6)}${k.slice(-4)}`;
};

/**
 * Media Storage (Cloudinary) secrets — org ke apne cloudinary account se
 * uploads ke liye. Super Admin ka platform account sirf fallback hai.
 * Save backend par real api.ping() se verify hota hai.
 * Super Admin kisi bhi org ki settings dekh/edit kar sakta hai (organizationId prop).
 */
interface StorageSettingsSectionProps {
  /** Super-admin override — kisi bhi org ki settings manage karne ke liye */
  organizationId?: string;
}

export default function StorageSettingsSection({ organizationId: orgProp }: StorageSettingsSectionProps = {}) {
  const { user } = useAppSelector((st) => st.auth);
  const orgId = orgProp ?? user?.organizationId ?? null;
  const [status, setStatus] = useState<StorageSettingsStatus | null>(null);
  const existingRef = useRef(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      const s = await storageSettingsService.getStatus(orgId);
      existingRef.current = s.source === 'organization' && Boolean(s.setting);
      setStatus(s);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Storage settings load failed');
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  // Pehle se saved creds form mein prefill — super admin ko nazar bhi aayen
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

  const onRemove = async () => {
    try {
      await storageSettingsService.remove(orgId);
      toast.success('Storage settings removed — platform storage active');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Remove failed');
    }
  };

  const isOwn = status?.source === 'organization';

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Media Storage (Cloudinary)</h3>
        <p className="text-sm text-gray-500">
          Photos aur documents isi Cloudinary account par save honge. Creds: cloudinary.com → Dashboard.
        </p>
      </div>
        <span className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
          isOwn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
        )}>
          {isOwn ? 'Apna account' : 'Platform default'}
        </span>
      </div>

      {!isOwn && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60">
          <p className="text-xs text-amber-700 font-medium">
            Abhi uploads platform ke shared storage par ja rahe hain — apne creds add karein taake aapka data aapke apne account par ho.
          </p>
        </div>
      )}

      {isOwn && status?.setting && (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5">
            <dt className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Cloud Name</dt>
            <dd className="font-medium text-gray-900 truncate">{status.setting.cloudName}</dd>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5">
            <dt className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">API Key</dt>
            <dd className="font-medium text-gray-900 truncate">{maskKey(status.setting.apiKey)}</dd>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5">
            <dt className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Status</dt>
            <dd className={cn('font-semibold', status.setting.isVerified ? 'text-emerald-600' : 'text-red-600')}>
              {status.setting.isVerified ? 'Verified' : 'Unverified'}
            </dd>
          </div>
        </dl>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Cloud Name" name="cloudName" value={values.cloudName as string}
          onChange={handleChange} onBlur={() => handleBlur('cloudName')} error={errors.cloudName}
          placeholder="oxford-group" required />
        <Input label="API Key" name="apiKey" value={values.apiKey as string}
          onChange={handleChange} onBlur={() => handleBlur('apiKey')} error={errors.apiKey}
          placeholder="123456789012345" required />
        <Input label={existingRef.current ? 'New API Secret (blank = keep current)' : 'API Secret'}
          name="apiSecret" type="password" value={values.apiSecret as string}
          onChange={handleChange} onBlur={() => handleBlur('apiSecret')} error={errors.apiSecret}
          placeholder="••••••••••••" />
        <div className="flex justify-end gap-2">
          {isOwn && <Button type="button" variant="danger" onClick={onRemove}>Remove</Button>}
          <Button type="submit" loading={isSubmitting}>Save & Verify</Button>
        </div>
      </form>
    </div>
  );
}
