'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import DailyAttendanceView from './parts/DailyAttendanceView';
import MonthlyAttendanceView from './parts/MonthlyAttendanceView';
import AttendanceRulesPanel from './parts/AttendanceRulesPanel';
import { useRoleAccess } from '@/hooks/useRoleAccess';

type Tab = 'daily' | 'monthly';

const TABS = [
  { key: 'daily' as Tab, label: '📅 Daily View', desc: 'Select any day to see which students were present, late, absent or on leave.' },
  { key: 'monthly' as Tab, label: '📊 Monthly View', desc: 'See monthly attendance summary per class and section.' },
];

export default function AttendanceRecordsPage() {
  const { school, user } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const { role } = useRoleAccess();
  const isReceptionist = role === 'RECEPTIONIST';
  const [tab, setTab] = useState<Tab>('daily');
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t.label}
            </button>
          ))}
        </div>
        {!isReceptionist && (
          <button onClick={() => setRulesOpen((v) => !v)}
            className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all',
              rulesOpen ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-primary-50 hover:text-primary-700 hover:ring-primary-200')}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timing Rules
          </button>
        )}
      </div>
      <p className="-mt-3 text-xs text-gray-400">{TABS.find((t) => t.key === tab)?.desc}</p>

      {rulesOpen && schoolId && <AttendanceRulesPanel schoolId={schoolId} onClose={() => setRulesOpen(false)} />}

      {tab === 'daily' ? <DailyAttendanceView /> : <MonthlyAttendanceView />}
    </div>
  );
}
