'use client';

import { memo, useMemo } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { Card, CardContent } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/utils/subjectColors';

const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Props {
  slots: TimetableSlot[];
  onEdit: (slot: TimetableSlot) => void;
  onDelete: (slot: TimetableSlot) => void;
}

const WeeklyTimetableGrid = memo(function WeeklyTimetableGrid({ slots, onEdit, onDelete }: Props) {
  const byDay = useMemo(() => {
    const map = new Map<number, TimetableSlot[]>();
    slots.forEach((s) => {
      const day = Number(s.dayOfWeek) === 0 ? 1 : Number(s.dayOfWeek);
      if (day >= 1 && day <= 7) {
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(s);
      }
    });
    map.forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [slots]);

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{DAYS_FULL.map((d) => <th key={d} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{d}</th>)}</tr>
          </thead>
          <tbody>
            <tr>
              {DAYS_FULL.map((_, dayIdx) => {
                const daySlots = byDay.get(dayIdx + 1) || [];
                return (
                  <td key={dayIdx} className="px-3 py-3 align-top border-r border-gray-50 last:border-0 min-w-[100px]">
                    {daySlots.length === 0 ? <span className="text-xs text-gray-300">—</span> : (
                      <div className="space-y-2">
                        {daySlots.map((slot) => {
                          const c = getSubjectColor(slot.subject?.name);
                          return (
                            <div key={slot.id} className={cn('border rounded-lg px-3 py-2 group relative', c.bg, c.border)}>
                              <p className={cn('text-xs font-mono', c.sub)}>{slot.startTime}–{slot.endTime}</p>
                              <p className={cn('text-sm font-medium truncate', c.text)}>{slot.subject?.name ?? slot.subjectId}</p>
                              <p className={cn('text-xs truncate', c.sub)}>{slot.teacher?.name ?? slot.teacherId}</p>
                              <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                                <button onClick={() => onEdit(slot)} className="p-1 rounded bg-white shadow text-gray-500 hover:text-primary-600" title="Edit">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => onDelete(slot)} className="p-1 rounded bg-white shadow text-gray-500 hover:text-red-600" title="Delete">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
});

export default WeeklyTimetableGrid;
