'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface MonthComparisonProps {
  current: Record<string, number>;
  previous: Record<string, number>;
  currentLabel: string;
  previousLabel: string;
}

function Delta({ curr, prev }: { curr: number; prev: number }) {
  const diff = curr - prev;
  if (diff === 0) return <span className="text-xs text-gray-400">—</span>;
  const up = diff > 0;
  return (
    <span className={cn('text-xs font-semibold', up ? 'text-emerald-600' : 'text-rose-600')}>
      {up ? '↑' : '↓'} {Math.abs(diff)}
    </span>
  );
}

const ROWS = [
  { key: 'PRESENT', label: 'Present', icon: '✅', color: 'text-emerald-600' },
  { key: 'LATE', label: 'Late', icon: '⏰', color: 'text-amber-600' },
  { key: 'ABSENT', label: 'Absent', icon: '❌', color: 'text-rose-600' },
  { key: 'LEAVE', label: 'Leave', icon: '🏖️', color: 'text-sky-600' },
  { key: 'HALF_DAY', label: 'Half Day', icon: '🔸', color: 'text-orange-600' },
];

const MonthComparison = memo(function MonthComparison({
  current, previous, currentLabel, previousLabel,
}: MonthComparisonProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Month-over-Month</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider text-right">{previousLabel}</th>
              <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider text-right">{currentLabel}</th>
              <th className="px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider text-right">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ROWS.map((row) => {
              const curr = current[row.key] ?? 0;
              const prev = previous[row.key] ?? 0;
              return (
                <tr key={row.key} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="text-sm">{row.icon}</span>
                    <span className={cn('text-sm font-medium ml-2', row.color)}>{row.label}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular-nums text-gray-500">{prev}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-gray-900">{curr}</td>
                  <td className="px-4 py-2.5 text-right"><Delta curr={curr} prev={prev} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default MonthComparison;
