'use client';

import { memo } from 'react';
import type { StaffAttendanceRecord } from '@/lib/api/staffAttendanceService';
import { cn } from '@/lib/utils';

interface AttendanceCalendarProps {
  year: number;
  month: number;
  today: Date;
  recordByDate: Record<string, StaffAttendanceRecord>;
  onDayClick?: (dateStr: string) => void;
}

const AttendanceCalendar = memo(function AttendanceCalendar({
  year, month, today, recordByDate, onDayClick,
}: AttendanceCalendarProps) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayOffset = new Date(year, month - 1, 1).getDay();

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
        <div key={d} className="text-center text-[11px] font-medium text-gray-400 uppercase py-1">{d}</div>
      ))}
      {Array.from({ length: firstDayOffset }, (_, i) => <div key={`e-${i}`} />)}
      {days.map((day) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const rec = recordByDate[dateStr];
        const status = rec?.status ?? null;
        const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

        return (
          <div
            key={day}
            onClick={() => onDayClick?.(dateStr)}
            className={cn(
              'aspect-square rounded-xl flex flex-col items-center justify-center text-sm',
              onDayClick && 'cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all',
              isToday && 'ring-2 ring-primary-400 ring-offset-1',
              status === 'PRESENT' && 'bg-emerald-50 text-emerald-700',
              status === 'LATE' && 'bg-amber-50 text-amber-700',
              status === 'ABSENT' && 'bg-rose-50 text-rose-700',
              status === 'LEAVE' && 'bg-sky-50 text-sky-700',
              status === 'HALF_DAY' && 'bg-orange-50 text-orange-700',
              !status && 'bg-gray-50 text-gray-400',
            )}
          >
            <span className="font-medium">{day}</span>
            {status && (
              <span className="text-[9px] font-bold uppercase leading-none mt-0.5">
                {status === 'HALF_DAY' ? 'HD' : status.slice(0, 2)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default AttendanceCalendar;
