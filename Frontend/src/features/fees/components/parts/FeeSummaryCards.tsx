import { formatCurrency } from '@/lib/utils';
import type { FeeSummary } from '@/types';

interface CardDef {
  key: string;
  label: string;
  get: (s: FeeSummary) => string;
  gradient: string;
  tint: string;
  iconPath: string;
  sub?: (s: FeeSummary) => string;
}

const CARDS: CardDef[] = [
  {
    key: 'total', label: 'Total Vouchers',
    get: (s) => String(s.total),
    gradient: 'from-primary-600 to-primary-800',
    tint: 'ring-1 ring-primary-100',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    key: 'collected', label: 'Collected',
    get: (s) => formatCurrency(s.collected),
    gradient: 'from-emerald-500 to-teal-600',
    tint: 'ring-1 ring-emerald-100',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'partial', label: 'Partial',
    get: (s) => String(s.counts.PARTIAL),
    gradient: 'from-amber-500 to-orange-500',
    tint: 'ring-1 ring-amber-100',
    iconPath: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z',
    sub: (s) => s.counts.PARTIAL > 0 ? `${s.counts.PARTIAL} student${s.counts.PARTIAL > 1 ? 's' : ''}` : 'None',
  },
  {
    key: 'outstanding', label: 'Outstanding',
    get: (s) => formatCurrency(s.outstanding),
    gradient: 'from-rose-500 to-pink-600',
    tint: 'ring-1 ring-rose-100',
    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'overdue', label: 'Overdue',
    get: (s) => String(s.counts.OVERDUE),
    gradient: 'from-red-500 to-red-700',
    tint: 'ring-1 ring-red-100',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
];

export default function FeeSummaryCards({ summary, themeColor }: { summary: FeeSummary | null; themeColor?: string | null }) {
  const tc = themeColor || undefined;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {CARDS.map((c) => {
        const val = summary ? c.get(summary) : '—';
        const sub = summary && c.sub ? c.sub(summary) : undefined;
        const isFirst = c.key === 'total';
        return (
          <div
            key={c.key}
            className={`group relative overflow-hidden rounded-3xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 sm:p-5 ${isFirst && tc ? 'border-transparent' : 'border-white'}`}
            style={isFirst && tc ? { background: `linear-gradient(135deg, ${tc}, ${tc}dd)`, color: '#fff' } : undefined}
          >
            <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.08] transition group-hover:scale-125`} />
            <div className="flex items-start justify-between gap-2">
              <div className={`${isFirst && tc ? '' : `bg-gradient-to-br ${c.gradient}`} flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm`} style={isFirst && tc ? { background: 'rgba(255,255,255,0.2)' } : undefined}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={c.iconPath} />
                </svg>
              </div>
            </div>
            <p className={`mt-4 text-[10px] font-bold uppercase tracking-[0.14em] ${isFirst && tc ? 'text-white/60' : 'text-slate-400'}`}>{c.label}</p>
            <p className={`text-xl font-extrabold tabular-nums leading-tight sm:text-2xl ${isFirst && tc ? 'text-white' : 'text-gray-900'}`}>{val}</p>
            {sub && <p className={`mt-0.5 truncate text-[10px] ${isFirst && tc ? 'text-white/50' : 'text-gray-400'}`}>{sub}</p>}
          </div>
        );
      })}
    </div>
  );
}
