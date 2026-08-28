interface MonthYearPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function MonthYearPicker({ year, month, onChange }: MonthYearPickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex items-end gap-2">
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Month</label>
        <select
          value={String(month)}
          onChange={(e) => onChange(year, Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-200 px-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={String(i + 1)}>{m}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Year</label>
        <select
          value={String(year)}
          onChange={(e) => onChange(Number(e.target.value), month)}
          className="h-9 rounded-lg border border-gray-200 px-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
        >
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
