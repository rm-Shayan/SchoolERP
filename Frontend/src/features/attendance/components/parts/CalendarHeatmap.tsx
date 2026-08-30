'use client';

import { useMemo } from 'react';
import type { AttendanceRecord } from '@/types';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getStartDay(year: number, month: number) {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function colorFor(pct: number | null, isWeekend: boolean) {
  if (isWeekend) return 'bg-gray-200';
  if (pct === null) return 'bg-gray-100';
  if (pct >= 85) return 'bg-emerald-500';
  if (pct >= 70) return 'bg-emerald-300';
  if (pct >= 55) return 'bg-amber-400';
  return 'bg-red-400';
}

interface Props {
  records: AttendanceRecord[];
  year: number;
  month: number;
  /** which weekdays are off — [0..6]. Default [0,6]. */
  weeklyOff?: number[];
}

export default function CalendarHeatmap({ records, year, month, weeklyOff }: Props) {
  const offSet = useMemo(() => new Set(weeklyOff ?? [0, 6]), [weeklyOff]);
  const dayMap = useMemo(() => {
    const map = new Map<string, { total: number; present: number }>();
    for (const r of records) {
      const key = String(r.date).split('T')[0];
      const entry = map.get(key) ?? { total: 0, present: 0 };
      entry.total++;
      if (r.status === 'PRESENT' || r.status === 'LATE') entry.present++;
      map.set(key, entry);
    }
    return map;
  }, [records]);

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);
  const cells: { day: number | null; pct: number | null; isWeekend: boolean; key: string }[] = [];

  for (let i = 0; i < startDay; i++) {
    cells.push({ day: null, pct: null, isWeekend: false, key: `pad-${i}` });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dt = new Date(year, month - 1, d);
    const isWeekend = offSet.has(dt.getDay());
    const entry = dayMap.get(dateStr);
    const pct = entry && entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : null;
    cells.push({ day: d, pct, isWeekend, key: dateStr });
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Attendance Heatmap</p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] font-semibold text-gray-400 text-center py-1">{w}</div>
        ))}
        {cells.map((c) => (
          <div key={c.key} className="flex items-center justify-center">
            {c.day !== null ? (
              <div
                title={c.isWeekend ? `${c.day} — Weekend` : c.pct !== null ? `${c.day} — ${c.pct}% attendance` : `${c.day} — No data`}
                className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-medium transition-all hover:ring-2 hover:ring-offset-1 hover:ring-primary-300 cursor-default',
                  colorFor(c.pct, c.isWeekend),
                  c.isWeekend || c.pct === null ? 'text-gray-400' : 'text-white'
                )}>
                {c.day}
              </div>
            ) : <div className="w-8 h-8" />}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <span className="text-[10px] text-gray-400 font-medium">Less</span>
        {[
          { color: 'bg-gray-100', label: 'No data' },
          { color: 'bg-gray-200', label: 'Weekend' },
          { color: 'bg-red-400', label: '<55%' },
          { color: 'bg-amber-400', label: '55-70%' },
          { color: 'bg-emerald-300', label: '70-85%' },
          { color: 'bg-emerald-500', label: '>85%' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={cn('w-3 h-3 rounded-sm', l.color)} />
            <span className="text-[10px] text-gray-400">{l.label}</span>
          </div>
        ))}
        <span className="text-[10px] text-gray-400 font-medium">More</span>
      </div>
    </div>
  );
}
