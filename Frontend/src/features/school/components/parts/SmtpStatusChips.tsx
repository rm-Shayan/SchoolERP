'use client';

import type { SmtpSettingsStatus } from '@/types';
import { pickExisting, type Scope, type Tier } from './smtpShared';

const SCOPES: Scope[] = ['organization', 'branch'];
const TIERS: Tier[] = ['PRIMARY', 'SECONDARY'];

/** 2x2 status grid — har scope+tier ka chip. Amber = Gmail ne quota reject kiya. */
export default function SmtpStatusChips({ status }: { status: SmtpSettingsStatus | null }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {SCOPES.flatMap((sc) =>
        TIERS.map((t) => {
          const info = pickExisting(status, sc, t);
          const tone = !info
            ? 'border-gray-200 bg-gray-50 text-gray-400'
            : info.lastError
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-green-200 bg-green-50 text-green-700';
          return (
            <div key={`${sc}-${t}`} className={`min-w-0 overflow-hidden rounded-lg border px-2.5 py-2 text-[11px] ${tone}`} title={info?.lastError || undefined}>
              <span className="font-semibold">{`${sc === 'organization' ? 'Org' : 'Branch'} ${t === 'PRIMARY' ? 'Primary' : 'Secondary'}`}: </span>
              {info ? `${info.lastError ? '⚠' : '✓'} ${info.username} (${info.dailyLimit ?? 500}/day)` : 'Not set'}
            </div>
          );
        })
      )}
    </div>
  );
}

