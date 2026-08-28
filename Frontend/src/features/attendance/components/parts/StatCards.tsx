'use client';

import { cn } from '@/lib/utils';

export interface StatData { label: string; value: number; accent: string }

export default function StatCards({ stats }: { stats: StatData[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className={cn('absolute top-0 right-0 w-16 h-16 rounded-bl-[3rem] opacity-10', s.accent)} />
          <p className="text-3xl font-extrabold tabular-nums text-gray-900">{s.value}</p>
          <p className="text-xs font-medium text-gray-400 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
