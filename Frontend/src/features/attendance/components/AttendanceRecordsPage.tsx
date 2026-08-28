'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import DailyAttendanceView from './parts/DailyAttendanceView';
import MonthlyAttendanceView from './parts/MonthlyAttendanceView';

type Tab = 'daily' | 'monthly';

const TABS = [
  { key: 'daily' as Tab, label: '📅 Daily View', desc: 'Pick a day, see class-wise attendance' },
  { key: 'monthly' as Tab, label: '📊 Monthly View', desc: 'Month summary by class/section' },
];

export default function AttendanceRecordsPage() {
  const [tab, setTab] = useState<Tab>('daily');

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
      <p className="text-xs text-gray-400 -mt-3">
        {tab === 'daily' ? 'Select any day to see which students were present, late, absent or on leave.' : 'See monthly attendance summary per class and section.'}
      </p>
      {tab === 'daily' ? <DailyAttendanceView /> : <MonthlyAttendanceView />}
    </div>
  );
}
