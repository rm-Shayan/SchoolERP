'use client';

import type { StorageSettingsStatus } from '@/types';
import { cn } from '@/lib/utils';

const maskKey = (key?: string | null) => {
  const k = String(key ?? '');
  if (k.length <= 8) return '••••••••';
  return `${k.slice(0, 4)}${'•'.repeat(6)}${k.slice(-4)}`;
};

export default function StorageStatusChips({ status }: { status: StorageSettingsStatus | null }) {
  const setting = status?.setting;
  const isOwn = status?.source === 'organization';

  return (
    <div className="flex flex-wrap gap-2">
      <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold',
        isOwn ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200/60')}>
        <span className={cn('w-1.5 h-1.5 rounded-full', isOwn ? 'bg-emerald-500' : 'bg-gray-400')} />
        {isOwn ? 'Apna account' : 'Platform default'}
      </span>
      {setting && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/60">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1H3V7z" /></svg>
          {setting.cloudName}
        </span>
      )}
      {setting && (
        <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold',
          setting.isVerified ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60')}>
          <span className={cn('w-1.5 h-1.5 rounded-full', setting.isVerified ? 'bg-emerald-500' : 'bg-amber-500')} />
          {setting.isVerified ? 'Verified' : 'Unverified'}
        </span>
      )}
      {setting && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/60">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          {maskKey(setting.apiKey)}
        </span>
      )}
    </div>
  );
}
