'use client';

import { memo, useMemo } from 'react';
import type { StaffAttendanceRecord } from '@/lib/api/staffAttendanceService';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-500', LATE: 'bg-amber-500', ABSENT: 'bg-rose-500',
  LEAVE: 'bg-sky-500', HALF_DAY: 'bg-orange-500',
};

const LEGEND = [
  { label: 'Present', cls: 'bg-emerald-500' },
  { label: 'Late', cls: 'bg-amber-500' },
  { label: 'Absent', cls: 'bg-rose-500' },
  { label: 'Leave', cls: 'bg-sky-500' },
];

interface WeeklyBarChartProps {
  year: number;
  month: number;
  records: StaffAttendanceRecord[];
}

interface WeekBucket {
  label: string;
  days: { status: string }[];
}

function buildWeeks(year: number, month: number, records: StaffAttendanceRecord[]): WeekBucket[] {
  const map: Record<string, string> = {};
  records.forEach((r) => { map[r.date?.slice(0, 10)] = r.status; });

  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks: WeekBucket[] = [];
  let current: WeekBucket | null = null;

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow === 0) continue; // skip Sunday

    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const status = map[key] ?? 'NONE';
    const isFirstWeekDay = dow === 1;

    if (isFirstWeekDay || !current) {
      if (current) weeks.push(current);
      current = { label: `W${weeks.length + 1}`, days: [] };
    }
    current!.days.push({ status });
  }
  if (current) weeks.push(current);
  return weeks;
}

const WeeklyBarChart = memo(function WeeklyBarChart({ year, month, records }: WeeklyBarChartProps) {
  const weeks = useMemo(() => buildWeeks(year, month, records), [year, month, records]);
  const maxDays = Math.max(1, ...weeks.map((w) => w.days.length));

  if (weeks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Weekly Breakdown</h3>
        <div className="flex items-center gap-3">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <span className={cn('w-2.5 h-2.5 rounded-sm', l.cls)} />
              <span className="text-[10px] text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-2 sm:gap-3 h-32">
        {weeks.map((week) => {
          const counts: Record<string, number> = {};
          week.days.forEach((d) => { counts[d.status] = (counts[d.status] ?? 0) + 1; });
          const total = week.days.length;

          return (
            <div key={week.label} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Stacked bar */}
              <div className="w-full flex flex-col-reverse rounded-lg overflow-hidden" style={{ height: `${(total / maxDays) * 100}%`, minHeight: '8px' }}>
                {(['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'HALF_DAY'] as const).map((s) => {
                  const count = counts[s] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={s}
                      className={cn('w-full transition-all', STATUS_COLORS[s])}
                      style={{ height: `${(count / total) * 100}%` }}
                      title={`${s}: ${count}`}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] font-medium text-gray-400">{week.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default WeeklyBarChart;
