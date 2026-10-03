'use client';

import type { SmtpSettingsStatus } from '@/types';
import { pickExisting, type Tier } from './smtpShared';

const TIERS: Tier[] = ['PRIMARY', 'SECONDARY'];

/** This branch's tier chips. Amber = Gmail ne quota reject kiya. */
export default function SmtpStatusChips({ status }: { status: SmtpSettingsStatus | null }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {TIERS.map((t) => {
        const info = pickExisting(status, t);
        const tone = !info
          ? 'border-gray-200 bg-gray-50 text-gray-400'
          : info.lastError
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-green-200 bg-green-50 text-green-700';
        return (
          <div key={t} className={`min-w-0 overflow-hidden rounded-lg border px-2.5 py-2 text-[11px] ${tone}`} title={info?.lastError || undefined}>
            <span className="font-semibold">{`${t === 'PRIMARY' ? 'Primary' : 'Secondary'}: `}</span>
            {info ? `${info.lastError ? '⚠' : '✓'} ${info.username} (${info.dailyLimit ?? 500}/day)` : 'Not set'}
          </div>
        );
      })}
    </div>
  );
}