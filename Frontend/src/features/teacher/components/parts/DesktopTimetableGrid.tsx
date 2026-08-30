'use client';

import { memo } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/utils/subjectColors';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_COLS = [1, 2, 3, 4, 5, 6, 7];

interface Props {
  timeRows: Array<{ start: string; end: string }>;
  grid: Map<string, TimetableSlot>;
  dates: string[];
  highlightDow: number;
}

const DesktopTimetableGrid = memo(function DesktopTimetableGrid({
  timeRows, grid, dates, highlightDow,
}: Props) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Time</th>
          {DAY_COLS.map((d) => (
            <th
              key={d}
              className={cn(
                'px-4 py-3 text-xs font-medium uppercase tracking-wider text-center',
                d === highlightDow ? 'text-primary-700 bg-primary-50/50' : 'text-gray-500',
              )}
            >
              <span className="hidden lg:inline">{DAY_NAMES[d]}</span>
              <span className="lg:hidden">{DAY_ABBR[d]}</span>
              <span className="block text-[10px] font-normal text-gray-400 mt-0.5">{dates[d - 1]}</span>
              {d === highlightDow && <span className="block text-[9px] font-bold text-primary-500 mt-0.5">TODAY</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {timeRows.map((tr) => (
          <tr key={`${tr.start}-${tr.end}`}>
            <td className="px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{tr.start} – {tr.end}</td>
            {DAY_COLS.map((d) => {
              const slot = grid.get(`${tr.start}-${tr.end}-${d}`);
              const c = slot ? getSubjectColor(slot.subject?.name) : null;
              return (
                <td key={d} className={cn('px-3 py-2 text-center', d === highlightDow && 'bg-primary-50/30')}>
                  {slot ? (
                    <div className={cn('border rounded-lg px-2 py-1.5', c!.bg, c!.border)}>
                      <p className={cn('text-sm font-medium', c!.text)}>{slot.subject?.name ?? '—'}</p>
                      <p className={cn('text-[10px]', c!.sub)}>{slot.section?.class?.name} {slot.section?.name}</p>
                    </div>
                  ) : <span className="text-xs text-gray-200">—</span>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export default DesktopTimetableGrid;
