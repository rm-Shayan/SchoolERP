'use client';

import { memo } from 'react';
import Link from 'next/link';
import Logo from '@/features/shared/components/Logo';
import type { OrganizationOverviewItem } from '@/types';
import { cn } from '@/lib/utils';

interface OrgLeaderboardProps {
  title: string;
  items: OrganizationOverviewItem[];
  max: number;
  field: 'revenue' | 'studentCount';
  hoverColor: string;
  barColor: string;
}

const fmtRev = (n: number) => `Rs ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtNum = (n: number) => n.toLocaleString();
const medalCls = ['bg-amber-100 text-amber-700', 'bg-gray-100 text-gray-500', 'bg-orange-100 text-orange-600'];
const medalIcon = ['🥇', '🥈', '🥉'];

const OrgLeaderboard = memo(function OrgLeaderboard({ title, items, max, field, hoverColor, barColor }: OrgLeaderboardProps) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <Link href="/admin/organizations" className="text-[11px] font-semibold text-primary-600 hover:text-primary-700">View all</Link>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((org, i) => {
          const val = field === 'revenue' ? (org.revenue ?? 0) : org.studentCount;
          const pct = max > 0 ? (val / max) * 100 : 0;
          const display = field === 'revenue' ? fmtRev(val) : `${fmtNum(val)} students`;
          return (
            <Link key={org.id} href={`/admin/organizations/${org.id}`}
              className={cn('flex items-center gap-3 px-5 py-2.5 transition-colors group', hoverColor)}>
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold',
                i < 3 ? medalCls[i] : 'bg-gray-50 text-gray-400')}>
                {i < 3 ? medalIcon[i] : `#${i + 1}`}
              </span>
              <Logo src={org.logoUrl} name={org.name} size="xs" />
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-semibold text-gray-900 truncate transition-colors',
                  hoverColor.includes('violet') ? 'group-hover:text-primary-700' : 'group-hover:text-emerald-700')}>{org.name}</p>
                <div className="mt-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="text-xs font-bold text-gray-700 tabular-nums whitespace-nowrap">{display}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});

export default OrgLeaderboard;
