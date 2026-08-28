'use client';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const today = () => new Date().toISOString().split('T')[0];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const PRESETS: { label: string; getRange: () => DateRange }[] = [
  { label: 'Today', getRange: () => ({ start: today(), end: today() }) },
  { label: 'Yesterday', getRange: () => ({ start: daysAgo(1), end: daysAgo(1) }) },
  { label: 'Last 7 Days', getRange: () => ({ start: daysAgo(6), end: today() }) },
  { label: 'Last 30 Days', getRange: () => ({ start: daysAgo(29), end: today() }) },
  { label: 'This Month', getRange: () => {
    const d = new Date();
    return {
      start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
      end: today(),
    };
  }},
  { label: 'Last Month', getRange: () => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const end = new Date(d.getFullYear(), d.getMonth(), 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }},
];

const inputCls = 'h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none';

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200/80 px-3 py-1.5 shadow-sm">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5 block">From</label>
          <input type="date" value={value.start} onChange={(e) => onChange({ ...value, start: e.target.value })} className={inputCls} />
        </div>
        <span className="text-gray-400 pb-1">—</span>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5 block">To</label>
          <input type="date" value={value.end} onChange={(e) => onChange({ ...value, end: e.target.value })} className={inputCls} />
        </div>
      </div>
      <div className="flex gap-1 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange(p.getRange())}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              value.start === p.getRange().start && value.end === p.getRange().end
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
