import { cn } from '@/lib/utils';

export interface FilterChipOption {
  value: string;
  label: string;
  count: number;
}

interface StatusFilterChipsProps {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function StatusFilterChips({ options, value, onChange }: StatusFilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? '' : opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
              active
                ? 'border-primary-500 bg-primary-600 text-white shadow-lg shadow-primary-500/25 scale-[1.02]'
                : 'border-gray-200/80 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:shadow-md hover:shadow-primary-500/5 hover:scale-[1.01]'
            )}
          >
            {opt.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              )}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
