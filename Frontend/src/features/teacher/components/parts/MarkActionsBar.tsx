'use client';

import type { AttendanceStatus } from '@/types';
import AttendanceSummary from './AttendanceSummary';
import { cn } from '@/lib/utils';

interface Props {
  counts: Record<string, number>;
  total: number;
  studentIds: string[];
  setMarks: (marks: Record<string, AttendanceStatus>) => void;
}

const tinyCls = (color: string) => cn('px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors', color);

export default function MarkActionsBar({ counts, total, studentIds, setMarks }: Props) {
  const setAll = (status: AttendanceStatus) => {
    const m: Record<string, AttendanceStatus> = {};
    studentIds.forEach((id) => { m[id] = status; });
    setMarks(m);
  };

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <AttendanceSummary counts={counts} total={total} />
      <div className="flex gap-1.5">
        <button onClick={() => setAll('PRESENT')} className={tinyCls('bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>All Present</button>
        <button onClick={() => setAll('ABSENT')} className={tinyCls('bg-red-50 text-red-700 hover:bg-red-100')}>All Absent</button>
      </div>
    </div>
  );
}