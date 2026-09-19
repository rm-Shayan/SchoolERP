import type { StudentSummary } from '@/lib/api/studentService';

interface StudentStatsProps {
  summary: StudentSummary | null;
  adminOnly?: boolean;
  themeColor?: string;
}

const CARDS = [
  {
    label: 'Total Students',
    get: (s: StudentSummary) => s.total,
    tint: 'sa-tint-1',
    iconTint: 'sa-icon-violet',
    sub: 'All enrolled records',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Active',
    get: (s: StudentSummary) => s.ACTIVE,
    tint: 'sa-tint-2',
    iconTint: 'sa-icon-emerald',
    sub: 'Currently enrolled',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Archived',
    get: (s: StudentSummary) => s.GRADUATED + s.DROPPED_OUT + s.TRANSFERRED_OUT,
    tint: 'sa-tint-3',
    iconTint: 'sa-icon-amber',
    sub: 'Graduated / left school',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    label: 'Blocked',
    get: (s: StudentSummary) => s.blocked,
    tint: 'sa-tint-4',
    iconTint: 'sa-icon-rose',
    sub: 'Portal access revoked',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
];

export function StudentStats({ summary, adminOnly = false, themeColor }: StudentStatsProps) {
  const cards = adminOnly ? CARDS : CARDS.slice(0, 2);
  const themed = themeColor ? { color: themeColor } : undefined;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative overflow-hidden rounded-3xl border border-primary-100 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-5 shadow-lg shadow-primary-500/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/10"
        >
          <div className={`absolute top-0 left-0 w-full h-1 ${card.tint} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconTint} shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              {card.icon}
            </div>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
              {card.sub}
            </span>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1" style={themed}>
              {card.label}
            </p>
            <p className="text-3xl font-black tabular-nums tracking-tight text-gray-900 dark:text-white transition-all duration-300">
              {summary ? card.get(summary) : '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}