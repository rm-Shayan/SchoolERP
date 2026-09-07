'use client';

import { Input, Button } from '@/features/shared/components';
import type { StorageSettingsStatus } from '@/types';
import { cn } from '@/lib/utils';

const maskKey = (key?: string | null) => {
  const k = String(key ?? '');
  if (k.length <= 8) return '••••••••';
  return `${k.slice(0, 4)}${'•'.repeat(6)}${k.slice(-4)}`;
};

interface Props {
  values: Record<string, unknown>;
  errors: Record<string, string | undefined>;
  isSubmitting: boolean;
  verifying: boolean;
  isOwn: boolean;
  setting: StorageSettingsStatus['setting'];
  existingCreds: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (name: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onVerify: () => void;
  onRemove: () => void;
  orgName?: string;
  branchName?: string;
  branches?: { id: string; name: string }[];
  selectedBranch?: string | null;
  onBranchChange?: (id: string | null) => void;
  lockedBranch?: boolean;
}

export default function StorageSettingsForm({
  values, errors, isSubmitting, verifying, isOwn, setting, existingCreds,
  handleChange, handleBlur, handleSubmit, onVerify, onRemove,
  orgName, branchName, branches, selectedBranch, onBranchChange, lockedBranch,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
        <p className="text-xs text-violet-700 font-medium">
          cloudinary.com → Dashboard → &quot;Product Environment&quot; — copy Cloud Name, API Key, and API Secret from here.
        </p>
      </div>

      {isOwn && setting && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <svg className="w-4 h-4 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1H3V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h18v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Current Configuration</span>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <dt className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Cloud Name</dt>
              <dd className="font-semibold text-gray-900 truncate mt-0.5">{setting.cloudName}</dd>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <dt className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">API Key</dt>
              <dd className="font-semibold text-gray-900 truncate mt-0.5">{maskKey(setting.apiKey)}</dd>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <dt className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Status</dt>
              <dd className={cn('font-semibold mt-0.5', setting.isVerified ? 'text-emerald-600' : 'text-amber-600')}>
                {setting.isVerified ? 'Connected & Verified' : 'Needs Verification'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {!isOwn && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700 font-medium">
            Uploads go to the platform&apos;s shared storage — add your own credentials so your data stays on your own account.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Credentials</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Organization" value={orgName ?? ''} readOnly className="bg-gray-50 cursor-not-allowed" />
            {!lockedBranch && branches && onBranchChange && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Branch</label>
                <select value={selectedBranch ?? ''} onChange={(e) => onBranchChange(e.target.value || null)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                  <option value="">All branches (org default)</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            {lockedBranch && branchName && (
              <Input label="Branch" value={branchName} readOnly className="bg-gray-50 cursor-not-allowed" />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Cloud Name" name="cloudName" value={values.cloudName as string}
              onChange={handleChange} onBlur={() => handleBlur('cloudName')} error={errors.cloudName}
              placeholder="oxford-group" required />
            <Input label="API Key" name="apiKey" value={values.apiKey as string}
              onChange={handleChange} onBlur={() => handleBlur('apiKey')} error={errors.apiKey}
              placeholder="123456789012345" required />
          </div>
          <Input label={existingCreds ? 'New API Secret (blank = keep current)' : 'API Secret'}
            name="apiSecret" type="password" value={values.apiSecret as string}
            onChange={handleChange} onBlur={() => handleBlur('apiSecret')} error={errors.apiSecret}
            placeholder="••••••••••••" />
        </div>
        <div className="flex justify-end gap-2">
          {isOwn && (
            <Button type="button" variant="danger" onClick={onRemove} className="text-sm">
              Remove
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onVerify} loading={verifying} className="text-sm">
            Verify Connection
          </Button>
          <Button type="submit" loading={isSubmitting} className="text-sm">
            Save & Verify
          </Button>
        </div>
      </form>
    </div>
  );
}
