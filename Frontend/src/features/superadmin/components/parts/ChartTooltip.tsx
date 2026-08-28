'use client';

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  stroke?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}

export default function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="min-w-[120px] rounded-xl border border-gray-200/70 bg-white/95 px-3 py-2 shadow-lg shadow-gray-900/10 backdrop-blur-sm">
      {label !== undefined && (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color || entry.stroke }}
            />
            <span className="text-gray-600">{entry.name}</span>
            <span className="ml-auto font-semibold text-gray-900 tabular-nums">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
