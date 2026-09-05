import type { PlatformDirectory } from '@/lib/api/staffService';

interface UsersStatsProps {
  data: PlatformDirectory | null;
}

const icon = (path: string) => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const statItems = [
  { key: 'total', label: 'Total', iconBg: 'sa-icon-violet', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'staff', label: 'Staff', iconBg: 'sa-icon-emerald', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { key: 'students', label: 'Students', iconBg: 'sa-icon-sky', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
  { key: 'orgs', label: 'Organizations', iconBg: 'sa-icon-amber', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
];

export default function UsersStats({ data }: UsersStatsProps) {
  const items = data?.items ?? [];
  const orgCount = new Set(items.filter((u) => u.type === 'staff').map((u) => u.organization?.id).filter(Boolean)).size;

  const values: Record<string, number> = {
    total: data?.total ?? 0,
    staff: data?.userTotal ?? 0,
    students: data?.studentTotal ?? 0,
    orgs: orgCount,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 sa-stagger">
      {statItems.map((item) => (
        <div key={item.key} className="group bg-white rounded-2xl border border-gray-200/60 p-5 sm:p-6 hover:shadow-[0_8px_32px_rgba(124,58,237,0.1)] hover:-translate-y-1 hover:border-primary-200/60 transition-all duration-300 overflow-hidden sa-fade-in">
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400 truncate uppercase tracking-wider">{item.label}</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1.5 tracking-tight tabular-nums truncate sa-count-up">
                {values[item.key].toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 ${item.iconBg}`}>
              {icon(item.d)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
