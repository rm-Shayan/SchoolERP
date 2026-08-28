import { formatDate } from '@/lib/utils';
import { StatTile } from '@/features/shared/components';
import type { Organization, School } from '@/types';

interface SchoolStatsProps {
  school: School;
  org: Organization;
}

const statItems = [
  {
    key: 'code',
    label: 'Branch Code',
    tint: 'sa-tint-1',
    iconBg: 'sa-icon-violet',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    key: 'created',
    label: 'Created',
    tint: 'sa-tint-2',
    iconBg: 'sa-icon-sky',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'org',
    label: 'Organization',
    tint: 'sa-tint-3',
    iconBg: 'sa-icon-emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function SchoolStats({ school, org }: SchoolStatsProps) {
  const values: Record<string, string> = {
    code: school.code,
    created: formatDate(school.createdAt),
    org: org.name,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 sa-stagger">
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
