'use client';

import { memo } from 'react';
import type { PlatformOverview } from '@/types';
import { cn } from '@/lib/utils';

interface OrgsStatsBarProps {
  stats?: PlatformOverview['stats'];
}

const fmt = (n: number) => n.toLocaleString();
const fmtRev = (n: number) => `Rs ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

interface StatItem {
  key: keyof NonNullable<PlatformOverview['stats']>;
  label: string;
  format: (n: number) => string;
  color: string;
  icon: React.ReactNode;
}

const OrgsStatsBar = memo(function OrgsStatsBar({ stats }: OrgsStatsBarProps) {
  const items: StatItem[] = [
    {
      key: 'totalOrganizations', label: 'Orgs', format: fmt, color: 'text-violet-600 bg-violet-50',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    },
    {
      key: 'totalSchools', label: 'Branches', format: fmt, color: 'text-sky-600 bg-sky-50',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" /></svg>,
    },
    {
      key: 'totalStudents', label: 'Students', format: fmt, color: 'text-emerald-600 bg-emerald-50',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>,
    },
    {
      key: 'totalRevenue', label: 'Revenue', format: fmtRev, color: 'text-amber-600 bg-amber-50',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-4">
      {items.map((t) => (
        <div key={t.key} className="bg-white px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex items-center gap-2">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', t.color)}>
              {t.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t.label}</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{t.format(stats?.[t.key] ?? 0)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default OrgsStatsBar;
