'use client';

import { memo } from 'react';
import type { Student, AttendanceStatus } from '@/types';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS } from './helpers';

interface Props {
  student: Student;
  status: AttendanceStatus;
  onToggle: (studentId: string, status: AttendanceStatus) => void;
}

const AttendanceRow = memo(function AttendanceRow({ student, status, onToggle }: Props) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{student.firstName} {student.lastName}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{student.rollNumber}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onToggle(student.id, opt.value)}
              className={cn(
                'w-9 h-8 rounded-md text-xs font-bold transition-colors',
                status === opt.value ? opt.classes : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
