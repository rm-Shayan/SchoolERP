'use client';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface ClassOpt {
  value: string;
  label: string;
}

interface Props {
  years: number[];
  year: number;
  month: number;
  classes: ClassOpt[];
  classFilter: string;
  offDaysCount: number;
  onYear: (y: number) => void;
  onMonth: (m: number) => void;
  onClass: (c: string) => void;
  onOpenOffDays: () => void;
}

export default function MonthlyFilters({
  years, year, month, classes, classFilter, offDaysCount,
  onYear, onMonth, onClass, onOpenOffDays,
}: Props) {
  const selectCls = 'h-9 rounded-lg border border-gray-200 px-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-300 outline-none';

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Month</label>
        <select value={String(month)} onChange={(e) => onMonth(Number(e.target.value))} className={selectCls}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Year</label>
        <select value={String(year)} onChange={(e) => onYear(Number(e.target.value))} className={selectCls}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="w-44">
        <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Class</label>
        <select value={classFilter} onChange={(e) => onClass(e.target.value)} className={selectCls}>
          {classes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <button onClick={onOpenOffDays}
        className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-50 px-3 text-xs font-semibold text-orange-600 transition-all hover:bg-orange-100">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Off Days{offDaysCount > 0 ? ` (${offDaysCount})` : ''}
      </button>
    </div>
  );
}