'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalAttendanceRecord, PortalAttendanceSummary } from '@/types/portal';
import { cn } from '@/lib/utils';

import { AttendanceSkeleton } from './PortalSkeletonsA';
import { usePortalEvents } from '@/hooks/usePortalEvents';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-400', LATE: 'bg-yellow-400', ABSENT: 'bg-red-400', LEAVE: 'bg-primary-400', HALF_DAY: 'bg-cyan-400', MANUAL_OVERRIDE: 'bg-gray-400',
};

export default function AttendanceTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<PortalAttendanceRecord[]>([]);
  const [summary, setSummary] = useState<PortalAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    portalDataService.getAttendance(month, year).then((d) => { setRecords(d.records); setSummary(d.summary); }).finally(() => setLoading(false));
  }, [month, year]);

  const dayMap = useMemo(() => {
    const map = new Map<string, PortalAttendanceRecord>();
    records.forEach((r) => map.set(r.date.split('T')[0], r));
    return map;
  }, [records]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const monthLabel = new Date(year, month - 1).toLocaleString('en-PK', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <MonthNav month={month} year={year} label={monthLabel} onPrev={() => month === 1 ? (setMonth(12), setYear((y) => y - 1)) : setMonth((m) => m - 1)} onNext={() => month === 12 ? (setMonth(1), setYear((y) => y + 1)) : setMonth((m) => m + 1)} />
      {loading ? <AttendanceSkeleton /> : (
        <>
          {summary && <SummaryCards summary={summary} />}
          <CalendarCard daysInMonth={daysInMonth} firstDay={firstDay} dayMap={dayMap} month={month} year={year} />
          <LiveAttendanceFeed />
        </>
      )}
    </div>
  );
}

function MonthNav({ label, onPrev, onNext }: { month: number; year: number; label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onPrev} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
      <button onClick={onNext} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}

function CalendarCard({ daysInMonth, firstDay, dayMap, month, year }: { daysInMonth: number; firstDay: number; dayMap: Map<string, PortalAttendanceRecord>; month: number; year: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2 font-medium">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const rec = dayMap.get(dateStr);
            return (
              <div key={day} className={cn('aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-all',
                rec ? `${STATUS_COLORS[rec.status] || 'bg-gray-100'} text-white shadow-sm` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              )} title={rec ? `${rec.status} — ${day}` : `${day}`}>
                {day}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-3 flex-wrap">
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
              <span className={cn('w-3 h-3 rounded-md', v)} />{k}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCards({ summary }: { summary: PortalAttendanceSummary }) {
  const items = [
    { label: 'Present', value: summary.present, color: '#22c55e' },
    { label: 'Late', value: summary.late, color: '#f59e0b' },
    { label: 'Absent', value: summary.absent, color: '#ef4444' },
    { label: 'Leave', value: summary.leave, color: '#6366f1' },
    ...(summary.halfDay > 0 ? [{ label: 'Half Day', value: summary.halfDay, color: '#0891b2' }] : []),
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((s) => (
        <Card key={s.label} className="p-3 text-center">
          <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          <p className="text-xs text-gray-500">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}

function LiveAttendanceFeed() {
  const { connected, attendanceEvents } = usePortalEvents();
  if (!attendanceEvents.length) return null;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300')} />
          <h3 className="font-semibold text-gray-900 text-sm">Live Updates</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-40 overflow-y-auto">
        {attendanceEvents.slice(0, 5).map((ev, i) => (
          <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-gray-700"><b>{ev.studentName}</b></span>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[ev.status] || 'bg-gray-100', ev.status !== 'ABSENT' ? 'text-white' : 'text-red-700')}>
              {ev.status}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
