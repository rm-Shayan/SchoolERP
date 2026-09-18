'use client';

import { useState } from 'react';
import AttendanceRecordsPage from '@/features/attendance/components/AttendanceRecordsPage';
import StaffAttendanceTab from '@/features/attendance/components/StaffAttendanceTab';
import { cn } from '@/lib/utils';

type Tab = 'student' | 'staff';

export default function AttendanceHub() {
  const [tab, setTab] = useState<Tab>('student');

  return (
    <div className="space-y-5">
      <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 sm:inline-flex sm:w-auto">
        {([
          { k: 'student', label: 'Student Attendance' },
          { k: 'staff', label: 'Staff Attendance' },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              'shrink-0 flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all sm:flex-none',
              tab === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'student' ? <AttendanceRecordsPage /> : <StaffAttendanceTab />}
    </div>
  );
}
