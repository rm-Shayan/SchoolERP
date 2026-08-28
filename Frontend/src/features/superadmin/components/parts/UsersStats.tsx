import type { PlatformUserDirectory } from '@/lib/api/staffService';

interface UsersStatsProps {
  data: PlatformUserDirectory | null;
}

const statItems = [
  {
    key: 'total' as const,
    label: 'Total Accounts',
    iconBg: 'sa-icon-violet',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    key: 'active' as const,
    label: 'Active',
    iconBg: 'sa-icon-emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'inactive' as const,
    label: 'Inactive',
    iconBg: 'sa-icon-rose',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'orgs' as const,
    label: 'Organizations',
    iconBg: 'sa-icon-sky',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function UsersStats({ data }: UsersStatsProps) {
  const stats = data?.stats;
  const orgCount = new Set((data?.items ?? []).map((u) => u.organizationId).filter(Boolean)).size;

  const getValue = (key: string) => {
    if (key === 'orgs') return orgCount;
    return stats?.[key as keyof typeof stats] ?? 0;
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
                {Number(getValue(item.key)).toLocaleString()}
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
