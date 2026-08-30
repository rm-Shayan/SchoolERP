'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { staffAttendanceService } from '@/lib/api';
import type { StaffAttendanceRecord } from '@/lib/api/staffAttendanceService';
import { cn } from '@/lib/utils';

const STATUS_BG: Record<string, string> = {
  PRESENT: 'bg-emerald-500', LATE: 'bg-amber-500', ABSENT: 'bg-rose-500',
  LEAVE: 'bg-sky-500', HALF_DAY: 'bg-orange-500',
};
const STATUS_TIP: Record<string, string> = {
  PRESENT: 'Present', LATE: 'Late', ABSENT: 'Absent', LEAVE: 'Leave', HALF_DAY: 'Half Day',
};
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

interface YearHeatmapProps {
  year: number;
}

const YearHeatmap = memo(function YearHeatmap({ year }: YearHeatmapProps) {
  const [allRecords, setAllRecords] = useState<StaffAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const promises = Array.from({ length: 12 }, (_, i) => {
          const m = i + 1;
          const start = `${year}-${String(m).padStart(2, '0')}-01`;
          const last = new Date(year, m, 0).getDate();
          const end = `${year}-${String(m).padStart(2, '0')}-${last}`;
          return staffAttendanceService.getMyAttendance({ startDate: start, endDate: end });
        });
        const results = await Promise.all(promises);
        if (!cancelled) {
          const all = results.flatMap((r) => r.data.data.records);
          setAllRecords(all);
        }
      } catch { /* noop */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [year]);

  const recordMap = useMemo(() => {
    const m: Record<string, string> = {};
    allRecords.forEach((r) => { m[r.date?.slice(0, 10)] = r.status; });
    return m;
  }, [allRecords]);

  // Build grid: 7 rows (Mon–Sun) × 53 cols
  const { grid, monthStarts } = useMemo(() => {
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    const startDow = jan1.getDay(); // 0=Sun
    const totalDays = Math.floor((dec31.getTime() - jan1.getTime()) / 86400000) + 1;

    const cells: { date: string; day: number; status: string | null }[] = [];
    const ms: { col: number; label: string }[] = [];
    let lastMonth = -1;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(year, 0, 1 + i);
      const dow = d.getDay();
      const col = Math.floor((i + startDow) / 7);
      const dateStr = d.toISOString().slice(0, 10);
      cells.push({ date: dateStr, day: dow, status: recordMap[dateStr] ?? null });

      if (d.getMonth() !== lastMonth && dow <= 1) {
        ms.push({ col, label: MONTH_LABELS[d.getMonth()] });
        lastMonth = d.getMonth();
      }
    }
    // Pad to fill last week
    while (cells.length % 7 !== 0) {
      cells.push({ date: '', day: -1, status: null });
    }

    const cols = cells.length / 7;
    const g: (typeof cells[0])[][] = [];
    for (let r = 0; r < 7; r++) {
      g.push(cells.filter((_, i) => i % 7 === r));
    }
    return { grid: g, monthStarts: ms };
  }, [year, recordMap]);

  const cols = grid[0]?.length ?? 0;

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-5 h-48 animate-pulse" />;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 overflow-x-auto">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{year} Attendance</h3>

      {/* Month labels */}
      <div className="flex ml-7 mb-1" style={{ width: `${cols * 14}px` }}>
        {monthStarts.map((m) => (
          <span key={m.label + m.col} className="text-[10px] text-gray-400" style={{ position: 'relative', left: `${m.col * 14}px` }}>{m.label}</span>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="h-[11px] text-[9px] text-gray-400 leading-[11px] text-right pr-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-col gap-0.5">
          {grid.map((row, ri) => (
            <div key={ri} className="flex gap-0.5">
              {row.map((cell, ci) => (
                <div
                  key={ci}
                  className={cn(
                    'w-[11px] h-[11px] rounded-[2px] transition-colors',
                    cell.status && STATUS_BG[cell.status] ? STATUS_BG[cell.status] : cell.date ? 'bg-gray-100' : 'bg-transparent',
                  )}
                  title={cell.date ? `${cell.date.slice(5)} — ${cell.status ? STATUS_TIP[cell.status] : 'No record'}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
        <span>No record</span>
        <span className="w-[11px] h-[11px] rounded-[2px] bg-gray-100 inline-block" />
        {Object.entries(STATUS_TIP).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={cn('w-[11px] h-[11px] rounded-[2px] inline-block', STATUS_BG[k])} />
            {v}
          </span>
        ))}
      </div>
    </div>
  );
});

export default YearHeatmap;
