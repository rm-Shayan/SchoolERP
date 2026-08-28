'use client';

import { memo } from 'react';
import type { PlatformOverview } from '@/types';

interface StatusStatsProps {
  stats?: PlatformOverview['stats'];
}

const items = [
  {
    key: 'totalRevenue' as const,
    label: 'Total Revenue',
    format: (v: number) => `Rs ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    iconBg: 'sa-icon-emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'active' as const,
    label: 'Delivered Orgs',
    format: (v: number) => String(v),
    iconBg: 'sa-icon-sky',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'blocked' as const,
    label: 'Blocked Orgs',
    format: (v: number) => String(v),
    iconBg: 'sa-icon-rose',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'partiallyBlocked' as const,
    label: 'Partially Blocked',
    format: (v: number) => String(v),
    iconBg: 'sa-icon-amber',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    key: 'setupPending' as const,
    label: 'Not Delivered',
    format: (v: number) => String(v),
    iconBg: 'sa-icon-violet',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const StatusStats = memo(function StatusStats({ stats }: StatusStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 sa-stagger">
      {items.map((item) => (
        <div
          key={item.key}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200/60 hover:shadow-md sm:p-5 sa-fade-in"
        >
          {/* Hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/0 group-hover:from-primary-50/15 group-hover:to-primary-100/5 transition-all duration-500 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-gray-400 truncate uppercase tracking-wider">{item.label}</p>
              <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1 tabular-nums truncate sa-count-up">
                {item.format(stats?.[item.key] ?? 0)}
              </p>
            </div>
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 ${item.iconBg}`}>
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default StatusStats;
