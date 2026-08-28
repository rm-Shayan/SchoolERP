'use client';

import { useMemo } from 'react';
import type { School } from '@/types';

interface BranchesStatsProps {
  schools: School[];
}

const statItems = [
  {
    key: 'branches',
    label: 'Branches',
    iconBg: 'sa-icon-violet',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'orgs',
    label: 'Organizations',
    iconBg: 'sa-icon-sky',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'students',
    label: 'Students',
    iconBg: 'sa-icon-emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C18.247 18.477 16.747 18 15 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    key: 'staff',
    label: 'Staff',
    iconBg: 'sa-icon-amber',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export default function BranchesStats({ schools }: BranchesStatsProps) {
  const counts = useMemo(() => {
    const orgs = new Set(schools.map((s) => s.organizationId).filter(Boolean)).size;
    const students = schools.reduce((sum, s) => sum + (s._count?.students ?? 0), 0);
    const staff = schools.reduce((sum, s) => sum + (s._count?.users ?? 0), 0);
    return { orgs, students, staff };
  }, [schools]);

  const values: Record<string, number> = {
    branches: schools.length,
    orgs: counts.orgs,
    students: counts.students,
    staff: counts.staff,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 sa-stagger">
      {statItems.map((item) => (
        <div
          key={item.key}
          className="group bg-white rounded-2xl border border-gray-200/60 p-5 sm:p-6 hover:shadow-[0_8px_32px_rgba(124,58,237,0.1)] hover:-translate-y-1 hover:border-primary-200/60 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden sa-fade-in"
        >
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400 truncate uppercase tracking-wider">{item.label}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1.5 tracking-tight tabular-nums truncate sa-count-up">
                {values[item.key].toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 ${item.iconBg}`}>
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
