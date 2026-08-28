import { formatCurrency } from '@/lib/utils';
import { StatTile } from '@/features/shared/components';
import type { Organization } from '@/types';

interface OrgStatsProps {
  org: Organization;
  branchCount: number;
}

const statItems = [
  {
    key: 'branches',
    label: 'Total Branches',
    tint: 'sa-tint-1',
    iconBg: 'sa-icon-violet',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'students',
    label: 'Total Students',
    tint: 'sa-tint-2',
    iconBg: 'sa-icon-sky',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
  {
    key: 'staff',
    label: 'Total Staff',
    tint: 'sa-tint-3',
    iconBg: 'sa-icon-emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    key: 'revenue',
    label: 'Collected Revenue',
    tint: 'sa-tint-4',
    iconBg: 'sa-icon-amber',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function OrgStats({ org, branchCount }: OrgStatsProps) {
  const values: Record<string, string | number> = {
    branches: branchCount,
    students: org._count?.students ?? 0,
    staff: org._count?.users ?? 0,
    revenue: formatCurrency(org.revenue ?? 0),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 sa-stagger">
      {statItems.map((item) => (
        <StatTile
          key={item.key}
          label={item.label}
          value={values[item.key]}
          icon={item.icon}
          iconBg={item.iconBg}
          tint={item.tint}
        />
      ))}
    </div>
  );
}
