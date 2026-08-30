'use client';

import { memo } from 'react';
import type { StaffAttendanceRecord } from '@/lib/api/staffAttendanceService';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<string, string> = {
  PRESENT: 'bg-emerald-500', LATE: 'bg-amber-500', ABSENT: 'bg-rose-500',
  LEAVE: 'bg-sky-500', HALF_DAY: 'bg-orange-500',
};

const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Present', LATE: 'Late', ABSENT: 'Absent', LEAVE: 'On Leave', HALF_DAY: 'Half Day',
};

interface AttendanceLogProps {
  records: StaffAttendanceRecord[];
}

const AttendanceLog = memo(function AttendanceLog({ records }: AttendanceLogProps) {
  const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-gray-200" />
      <div className="space-y-1">
        {sorted.map((rec) => {
          const date = new Date(rec.date);
          const dayName = date.toLocaleDateString('en-PK', { weekday: 'short' });
          const dateStr = date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
          const inTime = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : null;

          return (
            <div key={rec.id} className="relative flex items-start gap-3 py-2.5">
              <div className={cn('absolute left-[-15px] top-3.5 w-[10px] h-[10px] rounded-full border-2 border-white z-10', STATUS_DOT[rec.status] ?? 'bg-gray-300')} />
              <div className="flex-1 rounded-xl bg-gray-50/60 px-3.5 py-2.5 hover:bg-gray-100/80 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{dayName}</span>
                    <span className="text-xs text-gray-400 ml-2">{dateStr}</span>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    rec.status === 'PRESENT' && 'bg-emerald-100 text-emerald-700',
                    rec.status === 'LATE' && 'bg-amber-100 text-amber-700',
                    rec.status === 'ABSENT' && 'bg-rose-100 text-rose-700',
                    rec.status === 'LEAVE' && 'bg-sky-100 text-sky-700',
                    rec.status === 'HALF_DAY' && 'bg-orange-100 text-orange-700',
                  )}>
                    {STATUS_LABEL[rec.status] ?? rec.status}
                  </span>
                </div>
                {inTime && (
                  <div className="mt-1.5 text-xs text-gray-500">
                    <span>🟢 In: {inTime}</span>
                  </div>
                )}
                {rec.remarks && <p className="text-xs text-gray-400 mt-1 italic">{rec.remarks}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default AttendanceLog;
