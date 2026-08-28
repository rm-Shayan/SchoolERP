'use client';

import { useState } from 'react';
import StaffLeavePage from '@/features/staff/components/StaffLeavePage';
import StudentLeavePage from './StudentLeavePage';
import { cn } from '@/lib/utils';

type Tab = 'staff' | 'student';

export default function LeaveHub() {
  const [tab, setTab] = useState<Tab>('staff');

  return (
    <div className="space-y-5">
      <div className="inline-flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { k: 'staff', label: 'Staff Leave' },
          { k: 'student', label: 'Student Leave' },
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

      {tab === 'staff' ? <StaffLeavePage /> : <StudentLeavePage />}
    </div>
  );
}
