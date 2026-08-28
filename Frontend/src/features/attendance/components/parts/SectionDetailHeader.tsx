import { cn } from '@/lib/utils';

type ViewMode = 'monthly' | 'yearly';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Stats {
  present: number; late: number; absent: number; leave: number; pct: number;
}

interface Props {
  stats: Stats;
  view: ViewMode;
  year: number;
  month: number;
  onViewChange: (v: ViewMode) => void;
  onMonthYearChange: (y: number, m: number) => void;
}

const ITEMS = [
  { key: 'present' as const, label: 'Present', color: 'text-emerald-600' },
  { key: 'late' as const, label: 'Late', color: 'text-amber-600' },
  { key: 'absent' as const, label: 'Absent', color: 'text-red-500' },
  { key: 'leave' as const, label: 'Leave', color: 'text-blue-600' },
];

export default function SectionDetailHeader({ stats, view, year, month, onViewChange, onMonthYearChange }: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl border border-gray-200 bg-gray-50/50">
      <div className="flex items-center gap-3 flex-wrap">
        {ITEMS.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className={cn('text-lg font-extrabold tabular-nums', s.color)}>{stats[s.key]}</span>
            <span className="text-[10px] font-medium text-gray-400">{s.label}</span>
          </div>
        ))}
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-extrabold tabular-nums text-primary-700">{stats.pct}%</span>
          <span className="text-[10px] font-medium text-gray-400">Rate</span>
        </div>
      </div>

      <div className="sm:ml-auto flex items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
          {(['monthly', 'yearly'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => onViewChange(v)}
              className={cn('px-3 py-1.5 text-xs font-semibold transition-colors',
                view === v ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50')}>
              {v === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
        <select value={String(month)} onChange={(e) => onMonthYearChange(year, Number(e.target.value))}
          className="h-8 rounded-lg border border-gray-200 px-2 text-xs bg-white focus:ring-2 focus:ring-primary-300 outline-none">
          {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
        </select>
        <select value={String(year)} onChange={(e) => onMonthYearChange(Number(e.target.value), month)}
          className="h-8 rounded-lg border border-gray-200 px-2 text-xs bg-white focus:ring-2 focus:ring-primary-300 outline-none">
          {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}
