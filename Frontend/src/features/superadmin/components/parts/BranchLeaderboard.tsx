'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import type { School } from '@/types';
import { cn } from '@/lib/utils';
import { SchoolStatusBadge } from './StatusBadge';

interface BranchLeaderboardProps {
  title: string;
  schools: School[];
  field: 'studentCount' | 'staffCount';
  hoverColor: string;
  barColor: string;
}

const medalCls = ['bg-amber-100 text-amber-700', 'bg-gray-100 text-gray-500', 'bg-orange-100 text-orange-600'];
const medalIcon = ['🥇', '🥈', '🥉'];

const BranchLeaderboard = memo(function BranchLeaderboard({ title, schools, field, hoverColor, barColor }: BranchLeaderboardProps) {
  const sorted = useMemo(() => [...schools].sort((a, b) => {
    const aVal = field === 'studentCount' ? (a._count?.students ?? 0) : (a._count?.users ?? 0);
    const bVal = field === 'studentCount' ? (b._count?.students ?? 0) : (b._count?.users ?? 0);
    return bVal - aVal;
  }).slice(0, 5), [schools, field]);

  const max = field === 'studentCount'
    ? (sorted[0]?._count?.students ?? 1)
    : (sorted[0]?._count?.users ?? 1);

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {sorted.map((school, i) => {
          const val = field === 'studentCount' ? (school._count?.students ?? 0) : (school._count?.users ?? 0);
          const pct = max > 0 ? (val / max) * 100 : 0;
          return (
            <Link key={school.id} href={`/admin/organizations/${school.organizationId}/schools/${school.id}`}
              className={cn('flex items-center gap-3 px-5 py-2.5 transition-colors group', hoverColor)}>
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold',
                i < 3 ? medalCls[i] : 'bg-gray-50 text-gray-400')}>
                {i < 3 ? medalIcon[i] : `#${i + 1}`}
              </span>
              <Logo src={school.logoUrl || school.organization?.logoUrl} name={school.name} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">{school.name}</p>
                <p className="text-[10px] text-gray-400">{school.organization?.name ?? 'Unknown'}</p>
                <div className="mt-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="text-xs font-bold text-gray-700 tabular-nums">{val}</span>
            </Link>
          );
        })}
        {sorted.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No branches yet.</div>
        )}
      </div>
    </div>
  );
});

export default BranchLeaderboard;
