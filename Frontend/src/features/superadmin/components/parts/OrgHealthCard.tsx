'use client';

import { memo } from 'react';
import Logo from '@/features/shared/components/Logo';
import type { Organization } from '@/types';

interface OrgHealthCardProps {
  org: Organization;
  blocked: number;
  noAdmin: number;
  noStaff: number;
  totalBranches: number;
  onClick: () => void;
}

function OrgHealthCardBase({ org, blocked, noAdmin, noStaff, totalBranches, onClick }: OrgHealthCardProps) {
  const totalIssues = blocked + noAdmin + noStaff;
  const isHealthy = totalIssues === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm hover:shadow-[0_8px_32px_rgba(124,58,237,0.1)] hover:-translate-y-0.5 hover:border-primary-200/60 transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        <Logo src={org.logoUrl} name={org.name} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-gray-900">{org.name}</h3>
          <p className="text-xs text-gray-500">{org.code} · {totalBranches} branch{totalBranches === 1 ? '' : 'es'}</p>
        </div>
        {isHealthy ? (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Healthy
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
            {totalIssues} issue{totalIssues === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Blocked', count: blocked, bg: blocked ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400' },
          { label: 'No Admin', count: noAdmin, bg: noAdmin ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400' },
          { label: 'Zero Staff', count: noStaff, bg: noStaff ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-400' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl py-2 text-center ${s.bg}`}>
            <p className="text-base font-bold tabular-nums">{s.count}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {!isHealthy && (
        <p className="mt-3 text-[11px] text-primary-600 font-medium text-right">Click to view details →</p>
      )}
    </button>
  );
}

const OrgHealthCard = memo(OrgHealthCardBase);
export default OrgHealthCard;
