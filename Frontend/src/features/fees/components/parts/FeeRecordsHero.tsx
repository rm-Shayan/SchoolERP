import { formatCurrency } from '@/lib/utils';
import type { FeeSummary } from '@/types';

interface Props {
  summary: FeeSummary | null;
  dueDay: number;
  themeColor?: string | null;
  logoUrl?: string | null;
  schoolName?: string;
  onGenerate: () => void;
  onBulk: () => void;
  onDueDay: () => void;
  readOnly?: boolean;
}

function darken(hex: string, amt = 30) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function FeeRecordsHero({ summary, dueDay, themeColor, logoUrl, schoolName, onGenerate, onBulk, onDueDay, readOnly }: Props) {
  const pending = (summary?.counts.UNPAID || 0) + (summary?.counts.PARTIAL || 0) + (summary?.counts.OVERDUE || 0);
  const tc = themeColor || '#0f172a';
  return (
    <section className="overflow-hidden rounded-3xl text-white shadow-xl relative" style={{ background: `linear-gradient(135deg, ${tc}, ${darken(tc)})` }}>
      {/* Decorative circles */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
      <div className="absolute -right-8 top-20 h-24 w-24 rounded-full bg-white/5" />
      <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          {/* Header with logo */}
          <div className="mb-5 flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-9 w-9 rounded-xl object-contain bg-white/15 p-1" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-sm font-bold">
                {schoolName?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Fee Collection Desk</p>
              {schoolName && <p className="text-[11px] text-white/40">{schoolName}</p>}
            </div>
          </div>

          {/* Outstanding amount */}
          <p className="text-sm font-medium text-white/60">Total outstanding</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl tracking-tight">{formatCurrency(summary?.outstanding || 0)}</h1>

          {/* Stats row */}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20">
                <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              <span><span className="font-bold text-emerald-300">{formatCurrency(summary?.collected || 0)}</span> <span className="text-white/50">collected</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">
                <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </span>
              <span><span className="font-bold text-white">{pending}</span> <span className="text-white/50">open</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/20">
                <svg className="w-3.5 h-3.5 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </span>
              <span><span className="font-bold text-rose-300">{summary?.counts.OVERDUE || 0}</span> <span className="text-white/50">overdue</span></span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!readOnly && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col">
            <button onClick={onDueDay} className="flex items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Due {dueDay}th
            </button>
            <button onClick={onBulk} className="flex items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Bulk
            </button>
            <button onClick={onGenerate} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold hover:bg-white/90 transition-colors" style={{ color: tc }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Generate Monthly
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
