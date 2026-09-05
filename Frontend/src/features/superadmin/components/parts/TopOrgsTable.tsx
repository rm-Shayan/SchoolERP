'use client';

import { memo, useMemo, useState } from 'react';
import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import type { OrganizationOverviewItem } from '@/types';
import { cn } from '@/lib/utils';

interface TopOrgsTableProps {
  organizations: OrganizationOverviewItem[];
}

const fmtRev = (n: number) => `Rs ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const statusDot: Record<string, string> = {
  ACTIVE: 'bg-emerald-500',
  BLOCKED: 'bg-rose-500',
  PARTIALLY_BLOCKED: 'bg-amber-500',
  SETUP_PENDING: 'bg-slate-400',
};

const statusLabel: Record<string, string> = {
  ACTIVE: 'Active',
  BLOCKED: 'Blocked',
  PARTIALLY_BLOCKED: 'Partial',
  SETUP_PENDING: 'Pending',
};

const TopOrgsTable = memo(function TopOrgsTable({ organizations }: TopOrgsTableProps) {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    return [...organizations].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
  }, [organizations]);

  const shown = expanded ? sorted : sorted.slice(0, 5);
  const maxRevenue = sorted[0]?.revenue ?? 1;

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-100 sm:px-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Top Organizations by Revenue</h3>
          <p className="text-xs text-gray-400 mt-0.5">{sorted.length} organizations · sorted by collected revenue</p>
        </div>
        <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
          Top {shown.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">#</th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Organization</th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center">Branches</th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center">Students</th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center">Staff</th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Revenue</th>
              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((org, i) => {
              const revPct = maxRevenue > 0 ? ((org.revenue ?? 0) / maxRevenue) * 100 : 0;
              return (
                <tr key={org.id} className="border-b border-gray-50 hover:bg-violet-50/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-bold text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/organizations/${org.id}`} className="flex items-center gap-2.5 group">
                      <Logo src={org.logoUrl} name={org.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">{org.name}</p>
                        <p className="text-[11px] text-gray-400">{org.code}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">{org.schoolCount}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">{org.studentCount}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">{org.userCount}</td>
                  <td className="px-4 py-3">
                    <div className="min-w-[100px]">
                      <p className="font-semibold text-gray-900 tabular-nums">{fmtRev(org.revenue ?? 0)}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500" style={{ width: `${revPct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', statusDot[org.status] ?? 'bg-gray-400')} />
                      <span className="text-xs font-medium text-gray-600">{statusLabel[org.status] ?? org.status}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length > 5 && (
        <div className="px-4 py-2.5 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            {expanded ? 'Show less' : `View all ${sorted.length} organizations →`}
          </button>
        </div>
      )}
    </div>
  );
});

export default TopOrgsTable;
