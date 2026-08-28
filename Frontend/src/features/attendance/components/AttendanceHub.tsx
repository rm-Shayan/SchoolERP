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
      <div className="inline-flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { k: 'student', label: 'Student Attendance' },
          { k: 'staff', label: 'Staff Attendance' },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
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
