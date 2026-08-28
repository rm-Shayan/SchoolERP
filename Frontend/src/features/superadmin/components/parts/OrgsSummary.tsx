'use client';

import { memo } from 'react';

interface OrgsSummaryProps {
  orgCount: number;
  totalBranches: number;
  totalStaff: number;
}

const stats = [
  {
    key: 'orgs',
    label: 'Organizations',
    iconBg: 'sa-icon-violet',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 7h1m4 0h1m-1 4h1m-6 0h1m-1 4h1m4 0h1m-5 4v-3a1 1 0 011-1h2a1 1 0 011 1v3" />
      </svg>
    ),
  },
  {
    key: 'branches',
    label: 'Total Branches',
    iconBg: 'sa-icon-emerald',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM7 5a2 2 0 100 4 2 2 0 000-4zM7 9v8m10-4a4 4 0 00-4-4H7" />
      </svg>
    ),
  },
  {
    key: 'staff',
    label: 'Staff Accounts',
    iconBg: 'sa-icon-sky',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a3 3 0 100-6 3 3 0 000 6zm-8 2a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
  },
];

const OrgsSummary = memo(function OrgsSummary({ orgCount, totalBranches, totalStaff }: OrgsSummaryProps) {
  const values: Record<string, number> = { orgs: orgCount, branches: totalBranches, staff: totalStaff };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sa-stagger">
      {stats.map((s) => (
        <div key={s.key} className="group flex items-center gap-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_32px_rgba(124,58,237,0.1)] hover:-translate-y-0.5 hover:border-primary-200/60 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] sa-fade-in">
          <div className={`${s.iconBg} flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300`}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold leading-7 text-gray-900 tabular-nums sa-count-up">{values[s.key]}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

export default OrgsSummary;
