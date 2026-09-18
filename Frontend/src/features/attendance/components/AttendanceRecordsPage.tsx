'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { PageHeader } from '@/features/shared/components';
import { attendanceAlertsService } from '@/lib/api/attendanceAlertsService';
import DailyAttendanceView from './parts/DailyAttendanceView';
import MonthlyAttendanceView from './parts/MonthlyAttendanceView';
import AttendanceRulesPanel from './parts/AttendanceRulesPanel';
import { useRoleAccess } from '@/hooks/useRoleAccess';

type Tab = 'daily' | 'monthly';

const TABS = [
  { key: 'daily' as Tab, label: '📅 Daily View', desc: 'Select any day to see which students were present, late, absent or on leave.' },
  { key: 'monthly' as Tab, label: '📊 Monthly View', desc: 'See monthly attendance summary per class and section.' },
];

const ACTION_BTN = 'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all';

export default function AttendanceRecordsPage() {
  const { school, user } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const { role } = useRoleAccess();
  const isReceptionist = role === 'RECEPTIONIST';
  const [tab, setTab] = useState<Tab>('daily');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendAlerts = async () => {
    setSending(true);
    try {
      const r = await attendanceAlertsService.sendNow();
      toast.success(r.totalAlerts > 0 ? `Absent/late alerts sent (${r.totalAlerts})` : 'No alerts needed right now');
    } catch {
      toast.error('Failed to send attendance alerts');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance Records"
        description="View daily and monthly attendance summaries across classes."
        actions={
          !isReceptionist ? (
            <>
              <button onClick={handleSendAlerts} disabled={sending}
                className={cn(ACTION_BTN,
                  'bg-primary-600 text-white shadow-sm hover:bg-primary-700 disabled:opacity-60')}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {sending ? 'Sending...' : 'Send Absent Alerts'}
              </button>
              <button onClick={() => setRulesOpen((v) => !v)}
                className={cn(ACTION_BTN,
                  rulesOpen ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-primary-50 hover:text-primary-700 hover:ring-primary-200')}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Timing Rules
              </button>
            </>
          ) : undefined
        }
      />
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="-mt-3 text-xs text-gray-400">{TABS.find((t) => t.key === tab)?.desc}</p>

      {rulesOpen && schoolId && <AttendanceRulesPanel schoolId={schoolId} onClose={() => setRulesOpen(false)} />}

      {tab === 'daily' ? <DailyAttendanceView /> : <MonthlyAttendanceView />}
    </div>
  );
}
