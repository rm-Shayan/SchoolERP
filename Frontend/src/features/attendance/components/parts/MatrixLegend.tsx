import { cn } from '@/lib/utils';

const ITEMS = [
  ['bg-emerald-100 text-emerald-700', 'P', 'Present'],
  ['bg-amber-100 text-amber-700', 'L', 'Late'],
  ['bg-red-100 text-red-600', 'A', 'Absent'],
  ['bg-primary-100 text-primary-600', 'LV', 'Leave'],
  ['bg-primary-100 text-primary-700', 'HD', 'Half Day'],
  ['bg-orange-50 text-orange-500', 'H', 'Off / Holiday'],
  ['bg-gray-50 text-gray-300', '·', 'Not marked'],
  ['bg-gray-100/60 text-gray-200', '–', 'Weekend'],
] as const;

export default function MatrixLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 bg-gray-50/50 px-3 py-2">
      {ITEMS.map(([cls, letter, label]) => (
        <span key={label} className="flex items-center gap-1">
          <span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded text-[8px] font-bold', cls)}>{letter}</span>
          <span className="text-[10px] text-gray-400">{label}</span>
        </span>
      ))}
      <span className="ml-auto text-[10px] text-gray-400">Tap a cell to override a day.</span>
    </div>
  );
}