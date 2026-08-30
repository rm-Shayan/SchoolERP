'use client';

import { memo, useMemo } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { Card, CardContent } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/utils/subjectColors';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_COLS = [1, 2, 3, 4, 5, 6, 7];

interface GroupedRow {
  subjectName: string;
  startTime: string;
  endTime: string;
  sections: string[];
}

function groupByDay(slots: TimetableSlot[]) {
  const map = new Map<number, GroupedRow[]>();
  DAY_COLS.forEach((d) => map.set(d, []));
  for (const s of slots) {
    const arr = map.get(s.dayOfWeek);
    if (!arr) continue;
    const key = `${s.startTime}|${s.endTime}|${s.subjectId}`;
    const secLabel = s.section ? `${s.section.class?.name ?? ''} ${s.section.name}`.trim() : '';
    const existing = arr.find((r) => `${r.startTime}|${r.endTime}|${r.subjectName}` === `${s.startTime}|${s.endTime}|${s.subject?.name ?? ''}`);
    if (existing && secLabel) existing.sections.push(secLabel);
    else arr.push({ subjectName: s.subject?.name ?? '—', startTime: s.startTime, endTime: s.endTime, sections: secLabel ? [secLabel] : [] });
  }
  map.forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
  return map;
}

interface Props { slots: TimetableSlot[]; todayDow: number; onDayClick: (dow: number) => void; }

const WeekOverview = memo(function WeekOverview({ slots, todayDow, onDayClick }: Props) {
  const grouped = useMemo(() => groupByDay(slots), [slots]);

  return (
    <div className="space-y-2">
      {DAY_COLS.map((d) => {
        const dayRows = grouped.get(d) ?? [];
        const isToday = d === todayDow;
        return (
          <div key={d} className={cn('rounded-xl border overflow-hidden', isToday ? 'border-primary-200 bg-primary-50/30' : 'border-gray-100 bg-white')}>
            <button onClick={() => onDayClick(d)} className={cn('w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors', isToday && 'bg-primary-50/50')}>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-bold uppercase tracking-wider', isToday ? 'text-primary-700' : 'text-gray-500')}>{DAY_NAMES[d]}</span>
                {isToday && <span className="text-[9px] font-bold text-primary-500 bg-primary-100 px-1.5 py-0.5 rounded-full">TODAY</span>}
              </div>
              <span className="text-[10px] text-gray-400">{dayRows.length} {dayRows.length === 1 ? 'slot' : 'slots'}</span>
            </button>
            {dayRows.length > 0 && (
              <div className="px-3 pb-2 space-y-1">
                {dayRows.map((row, i) => {
                  const sc = getSubjectColor(row.subjectName);
                  return (
                    <div key={i} className={cn('flex items-center gap-2 rounded-lg px-2.5 py-1.5 border', sc.bg, sc.border)}>
                      <span className={cn('text-[10px] tabular-nums font-medium shrink-0', sc.sub)}>{row.startTime}</span>
                      <span className={cn('text-[10px] font-semibold truncate', sc.text)}>{row.subjectName}</span>
                      {row.sections.length > 0 && (
                        <span className="text-[8px] text-gray-400 truncate ml-auto">
                          {row.sections.length === 1 ? row.sections[0] : `${row.sections.length} sections`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {dayRows.length === 0 && <div className="px-3 pb-2"><span className="text-[10px] text-gray-300 italic">No classes</span></div>}
          </div>
        );
      })}
    </div>
  );
});

export default WeekOverview;
