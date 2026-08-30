'use client';

import { memo, useMemo } from 'react';
import { Card } from '@/features/shared/components';
import { cn } from '@/lib/utils';

interface Props {
  counts: Record<string, number>;
  total: number;
}

const STAT_CARDS = [
  { key: 'PRESENT', label: 'Present', emoji: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  { key: 'LATE', label: 'Late', emoji: '⏰', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  { key: 'ABSENT', label: 'Absent', emoji: '❌', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  { key: 'LEAVE', label: 'Leave', emoji: '🏖️', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
];

const AttendanceSummary = memo(function AttendanceSummary({ counts, total }: Props) {
  const presentCount = (counts.PRESENT ?? 0) + (counts.LATE ?? 0);
  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (pct / 100) * circumference;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Ring */}
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="20" cy="20" r="18" fill="none" stroke={pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">{pct}%</span>
      </div>

      {/* Stat cards */}
      <div className="flex gap-2 flex-wrap">
        {STAT_CARDS.map((s) => {
          const count = counts[s.key] ?? 0;
          if (count === 0 && s.key !== 'PRESENT') return null;
          return (
            <div key={s.key} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1', s.bg, s.text, s.ring)}>
              <span>{s.emoji}</span>
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default AttendanceSummary;
