'use client';

import { useMemo } from 'react';
import type { AttendanceRecord, StudentLite } from '@/types';
import { cn } from '@/lib/utils';
import MatrixLegend from './MatrixLegend';
import {
  SYMBOL,
  CELL_STYLE,
  OFF_STYLE,
  DOW_LETTERS,
  pad,
  buildSegments,
  buildRecordMap,
  buildOffDayMap,
} from './matrixView';

interface Props {
  students: StudentLite[];
  records: AttendanceRecord[];
  offDays?: { date: string; reason?: string | null }[];
  /** which weekdays are off — [0..6]. Default [0,6]. */
  weeklyOff?: number[];
  year: number;
  month: number;
  onOverride: (studentId: string, date: string, record?: AttendanceRecord) => void;
}

export default function MonthlyMatrixTable({ students, records, offDays, weeklyOff, year, month, onOverride }: Props) {
  const { total, segments, recordMap, today, offDayMap, weeklyOffSet } = useMemo(() => {
    const total = new Date(year, month, 0).getDate();
    const t = new Date();
    const todayStr = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    return {
      total,
      segments: buildSegments(total),
      recordMap: buildRecordMap(records),
      today: todayStr,
      offDayMap: buildOffDayMap(offDays ?? []),
      weeklyOffSet: new Set(weeklyOff ?? [0, 6]),
    };
  }, [records, offDays, weeklyOff, year, month]);

  const rowCounts = useMemo(() => {
    const counts = new Map<string, { P: number; L: number; A: number; LV: number; HD: number }>();
    for (const r of records) {
      const c = counts.get(r.studentId) ?? { P: 0, L: 0, A: 0, LV: 0, HD: 0 };
      if (r.status === 'PRESENT') c.P++;
      else if (r.status === 'LATE') c.L++;
      else if (r.status === 'ABSENT') c.A++;
      else if (r.status === 'LEAVE') c.LV++;
      else if (r.status === 'HALF_DAY') c.HD++;
      counts.set(r.studentId, c);
    }
    return counts;
  }, [records]);

  const dateStr = (d: number) => `${year}-${pad(month)}-${pad(d)}`;
  const renderDays = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

  const dayCell = (d: number, stuId?: string) => {
    const dow = new Date(year, month - 1, d).getDay();
    const isWeekend = weeklyOffSet.has(dow);
    const dateKey = dateStr(d);
    const rec = stuId ? recordMap.get(`${stuId}:${dateKey}`) : undefined;
    const isToday = dateKey === today;
    const offReason = stuId ? offDayMap.get(dateKey) : undefined;
    const isOff = !!offReason;
    return (
      <div key={d} className="w-7 shrink-0">
        {stuId ? (
          <button
            title={isWeekend ? `${d} — Weekend` : isOff ? `${d} — ${offReason}` : rec ? `${d} — ${rec.status}` : `${d} — tap to mark`}
            disabled={isWeekend || isOff}
            onClick={() => !isWeekend && !isOff && onOverride(stuId, dateKey, rec)}
            className={cn('mx-px h-6 w-full rounded text-[10px] font-bold tabular-nums transition-all',
              rec ? CELL_STYLE[rec.status] ?? 'bg-gray-100 text-gray-500' : isOff ? OFF_STYLE : isWeekend ? 'bg-gray-100/60 text-gray-200 cursor-not-allowed' : 'bg-gray-50 text-gray-300 hover:bg-primary-50 hover:text-primary-500',
              isToday && 'ring-1 ring-inset ring-primary-400')}
          >
            {isWeekend ? '–' : isOff ? 'H' : rec ? SYMBOL[rec.status] ?? '?' : '·'}
          </button>
        ) : (
          <span className={cn('block py-1 text-center text-[9px] text-gray-400', isWeekend && 'text-gray-300')}>{DOW_LETTERS[dow]}</span>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="sticky left-0 z-20 bg-gray-50/95 py-2.5 px-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Student
              </th>
              {segments.map((seg) => (
                <th key={seg.from} colSpan={seg.to - seg.from + 1}
                  className="border-l border-gray-100 px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Days {seg.from}–{seg.to}
                </th>
              ))}
              <th className="border-l border-gray-100 py-2 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                P/L/A
              </th>
            </tr>
            <tr className="border-b border-gray-50">
              <th className="sticky left-0 z-20 bg-white" />
              {segments.map((seg) => (
                <th key={`w-${seg.from}`} colSpan={seg.to - seg.from + 1}>
                  <div className="flex border-l border-gray-50">{renderDays(seg.from, seg.to).map((d) => dayCell(d))}</div>
                </th>
              ))}
              <th className="border-l border-gray-50" />
            </tr>
          </thead>
          <tbody>
            {students.map((stu) => {
              const cnt = rowCounts.get(stu.id) ?? { P: 0, L: 0, A: 0, LV: 0, HD: 0 };
              return (
                <tr key={stu.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/40">
                  <td className="sticky left-0 z-10 bg-white py-1.5 px-3">
                    <p className="max-w-[150px] truncate text-xs font-semibold text-gray-900">{stu.firstName} {stu.lastName}</p>
                    <p className="text-[10px] text-gray-400">#{stu.rollNumber}</p>
                  </td>
                  {segments.map((seg) => (
                    <td key={`${stu.id}-${seg.from}`} colSpan={seg.to - seg.from + 1} className="border-l border-gray-50 py-1.5">
                      <div className="flex">{renderDays(seg.from, seg.to).map((d) => dayCell(d, stu.id))}</div>
                    </td>
                  ))}
                  <td className="border-l border-gray-50 py-1.5 px-3 text-center">
                    <span className="text-[10px] font-semibold tabular-nums text-gray-400">
                      <b className="text-emerald-600">{cnt.P}</b> · <b className="text-amber-600">{cnt.L}</b> · <b className="text-red-500">{cnt.A}</b> · <b className="text-primary-600">{cnt.HD}</b>
                    </span>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr><td colSpan={total + 2} className="py-10 text-center text-sm text-gray-400">No students in this section.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <MatrixLegend />
    </div>
  );
}