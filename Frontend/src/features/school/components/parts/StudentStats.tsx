import type { StudentSummary } from '@/lib/api/studentService';

interface StudentStatsProps {
  summary: StudentSummary | null;
}

const CARDS = [
  {
    label: 'Total Students',
    get: (s: StudentSummary) => s.total,
    chip: 'from-primary-500 to-primary-700',
    tint: 'ring-primary-100',
    bg: 'bg-primary-50',
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
    chip: 'from-emerald-500 to-primary-600',
    tint: 'ring-emerald-100',
    bg: 'bg-emerald-50',
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
    chip: 'from-amber-500 to-orange-600',
    tint: 'ring-amber-100',
    bg: 'bg-amber-50',
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
    chip: 'from-rose-500 to-red-700',
    tint: 'ring-rose-100',
    bg: 'bg-rose-50',
    sub: 'Portal access revoked',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
];

export function StudentStats({ summary }: StudentStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {CARDS.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ${card.tint} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
        >
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.chip}`} />
          <div className="flex items-start justify-between gap-2">
            <div className={`${card.chip} flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm`}>
              {card.icon}
            </div>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">{card.sub}</span>
          </div>
          <p className="mt-3 text-xs font-medium text-gray-500">{card.label}</p>
          <p className="text-2xl font-extrabold tabular-nums leading-tight text-gray-900 sm:text-3xl">
            {summary ? card.get(summary) : '—'}
          </p>
        </div>
      ))}
    </div>
  );
}
