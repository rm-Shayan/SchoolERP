'use client';

import { memo, useMemo } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { Card, CardContent, EmptyState } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/utils/subjectColors';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_COLS = [1, 2, 3, 4, 5, 6, 7];

interface Props {
  slots: TimetableSlot[];
  sectionLabel: string;
}

const SectionTimetableOverview = memo(function SectionTimetableOverview({ slots, sectionLabel }: Props) {
  const timeRows = useMemo(() => {
    const map = new Map<string, { start: string; end: string }>();
    slots.forEach((s) => { const k = `${s.startTime}-${s.endTime}`; if (!map.has(k)) map.set(k, { start: s.startTime, end: s.endTime }); });
    return Array.from(map.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [slots]);

  const grid = useMemo(() => {
    const g = new Map<string, TimetableSlot>();
    slots.forEach((s) => g.set(`${s.startTime}-${s.endTime}-${s.dayOfWeek}`, s));
    return g;
  }, [slots]);

  if (slots.length === 0) {
    return <Card><CardContent className="py-6"><EmptyState title="No timetable" description={`No slots assigned for ${sectionLabel}.`} /></CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/70">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{sectionLabel}</h4>
        </div>
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead>
            <tr>
              <th className="px-3 py-2 text-[10px] font-medium text-gray-400 uppercase w-20">Time</th>
              {DAY_COLS.map((d) => <th key={d} className="px-3 py-2 text-[10px] font-medium text-gray-400 uppercase text-center">{DAY_NAMES[d]}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {timeRows.map((tr) => (
              <tr key={`${tr.start}-${tr.end}`} className="hover:bg-gray-50/50">
                <td className="px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap">{tr.start}–{tr.end}</td>
                {DAY_COLS.map((d) => {
                  const slot = grid.get(`${tr.start}-${tr.end}-${d}`);
                  const c = slot ? getSubjectColor(slot.subject?.name) : null;
                  return (
                    <td key={d} className="px-2 py-1.5 text-center">
                      {slot ? (
                        <div className={cn('rounded-md px-1.5 py-1 border', c!.bg, c!.border)}>
                          <p className={cn('text-[11px] font-medium leading-tight', c!.text)}>{slot.subject?.name}</p>
                          <p className="text-[9px] text-gray-400 leading-tight">{slot.teacher?.name}</p>
                        </div>
                      ) : <span className="text-[10px] text-gray-200">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
});

export default SectionTimetableOverview;
