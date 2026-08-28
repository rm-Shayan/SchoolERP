'use client';

import { memo } from 'react';
import { StatTile } from '@/features/shared/components';
import type { PlatformOverview } from '@/types';

interface StatCardsProps {
  stats?: PlatformOverview['stats'];
}

interface StatCardConfig {
  key: keyof PlatformOverview['stats'];
  label: string;
  sub: string;
  iconBg: string;
  icon: React.ReactNode;
}

const cards: StatCardConfig[] = [
  {
    key: 'totalOrganizations',
    label: 'Organizations',
    sub: 'Tenants on platform',
    iconBg: 'sa-icon-violet',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'totalSchools',
    label: 'Branches',
    sub: 'Campuses across tenants',
    iconBg: 'sa-icon-emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'activeStudents',
    label: 'Active Students',
    sub: 'Currently enrolled',
    iconBg: 'sa-icon-sky',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    key: 'totalStaffUsers',
    label: 'Staff Accounts',
    sub: 'Users with access',
    iconBg: 'sa-icon-amber',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

const StatCards = memo(function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 sa-stagger">
      {cards.map((c) => (
        <StatTile
          key={c.key}
          label={c.label}
          sub={c.sub}
          value={Number(stats?.[c.key] ?? 0).toLocaleString()}
          icon={c.icon}
          iconBg={c.iconBg}
        />
      ))}
    </div>
  );
});

export default StatCards;
