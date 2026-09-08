'use client';

import { memo } from 'react';
import type { Student, AttendanceStatus } from '@/types';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS } from './helpers';

interface Props {
  student: Student;
  status: AttendanceStatus;
  pct?: number; // -1 = no data, 0-100 = percentage
  onToggle: (studentId: string, status: AttendanceStatus) => void;
}

const STATUS_BG: Record<string, string> = {
  PRESENT: 'bg-emerald-50',
  LATE: 'bg-amber-50',
  ABSENT: 'bg-red-50',
  LEAVE: 'bg-primary-50',
};

const AttendanceRow = memo(function AttendanceRow({ student, status, pct, onToggle }: Props) {
  const pctColor = pct == null || pct < 0 ? 'text-gray-300' : pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600';
  return (
    <tr className={cn('transition-colors', STATUS_BG[status] ?? 'hover:bg-gray-50')}>
      <td className="px-4 py-2.5 min-w-0">
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : status === 'LATE' ? 'bg-amber-100 text-amber-700' : status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700')}>
            {student.firstName?.[0]}{student.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{student.firstName} {student.lastName}</p>
            <p className="text-[10px] text-gray-400">Roll #{student.rollNumber}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        {pct != null && pct >= 0 ? (
          <span className={`text-sm font-bold tabular-nums ${pctColor}`}>{pct}<span className="text-[10px] font-medium">%</span></span>
        ) : (
          <span className="text-[10px] text-gray-300">—</span>
        )}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onToggle(student.id, opt.value)}
              className={cn(
                'w-9 h-8 rounded-lg text-[11px] font-bold transition-all',
                status === opt.value ? cn(opt.classes, 'ring-2 ring-offset-1', opt.value === 'PRESENT' ? 'ring-emerald-300' : opt.value === 'LATE' ? 'ring-amber-300' : opt.value === 'ABSENT' ? 'ring-red-300' : 'ring-primary-300') : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
});

AttendanceRow.displayName = 'AttendanceRow';
export default AttendanceRow;
