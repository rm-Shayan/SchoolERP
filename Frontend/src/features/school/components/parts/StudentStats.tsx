import type { StudentSummary } from '@/lib/api/studentService';

interface StudentStatsProps {
  summary: StudentSummary | null;
  adminOnly?: boolean;
}

const CARDS = [
  {
    label: 'Total Students',
    get: (s: StudentSummary) => s.total,
    chip: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    tint: 'border-indigo-500/20 group-hover:border-indigo-500/40',
    bg: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
    sub: 'All enrolled records',
    shadow: 'shadow-indigo-500/20',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Active',
    get: (s: StudentSummary) => s.ACTIVE,
    chip: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    tint: 'border-emerald-500/20 group-hover:border-emerald-500/40',
    bg: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
    sub: 'Currently enrolled',
    shadow: 'shadow-emerald-500/20',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Archived',
    get: (s: StudentSummary) => s.GRADUATED + s.DROPPED_OUT + s.TRANSFERRED_OUT,
    chip: 'bg-gradient-to-br from-amber-400 to-orange-500',
    tint: 'border-amber-500/20 group-hover:border-amber-500/40',
    bg: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
    sub: 'Graduated / left school',
    shadow: 'shadow-amber-500/20',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    label: 'Blocked',
    get: (s: StudentSummary) => s.blocked,
    chip: 'bg-gradient-to-br from-rose-500 to-red-600',
    tint: 'border-rose-500/20 group-hover:border-rose-500/40',
    bg: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
    sub: 'Portal access revoked',
    shadow: 'shadow-rose-500/20',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
];

export function StudentStats({ summary, adminOnly = false }: StudentStatsProps) {
  const cards = adminOnly ? CARDS : CARDS.slice(0, 2);
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`group relative overflow-hidden rounded-3xl border ${card.tint} ${card.bg} p-5 shadow-lg ${card.shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.chip} shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              {card.icon}
            </div>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
              {card.sub}
            </span>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{card.label}</p>
            <p className={`text-3xl font-black tabular-nums tracking-tight text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:${card.chip.split(' ')[0]} transition-all duration-300`}>
              {summary ? card.get(summary) : '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
