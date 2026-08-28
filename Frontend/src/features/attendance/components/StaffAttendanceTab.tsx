'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import StaffAttendanceDailyView from './StaffAttendanceDailyView';
import StaffAttendanceMonthlyView from './StaffAttendanceMonthlyView';

const TABS = [
  { key: 'daily', label: 'Daily Mark' },
  { key: 'monthly', label: 'Monthly Ledger' },
] as const;

export default function StaffAttendanceTab() {
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');

  return (
    <div className="space-y-5">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'daily' ? <StaffAttendanceDailyView /> : <StaffAttendanceMonthlyView />}
    </div>
  );
}
