'use client';

import { memo, useMemo } from 'react';
import type { StaffAttendanceRecord } from '@/lib/api/staffAttendanceService';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
  PRESENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', icon: '✅' },
  LATE: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', icon: '⏰' },
  ABSENT: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', icon: '❌' },
  LEAVE: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', icon: '🏖️' },
  HALF_DAY: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', icon: '🔸' },
};

function isGood(status: string) {
  return status === 'PRESENT' || status === 'LATE';
}

function calcStreak(recordByDate: Record<string, StaffAttendanceRecord>, now: Date): number {
  let streak = 0;
  const d = new Date(now);
  const todayKey = d.toISOString().slice(0, 10);
  const todayRec = recordByDate[todayKey];
  if (!todayRec || !isGood(todayRec.status)) d.setDate(d.getDate() - 1);
  while (true) {
    const dow = d.getDay();
    if (dow === 0) { d.setDate(d.getDate() - 1); continue; }
    const rec = recordByDate[d.toISOString().slice(0, 10)];
    if (!rec || !isGood(rec.status)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function calcBestStreak(recordByDate: Record<string, StaffAttendanceRecord>): number {
  const dates = Object.keys(recordByDate).filter((d) => isGood(recordByDate[d].status)).sort();
  if (dates.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    // Same streak if consecutive day or Saturday→Monday (skip Sunday)
    if (diffDays === 1 || diffDays === 2) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

interface TodayStatusCardProps {
  todayRecord: StaffAttendanceRecord | null;
  recordByDate: Record<string, StaffAttendanceRecord>;
  now: Date;
}

const TodayStatusCard = memo(function TodayStatusCard({ todayRecord, recordByDate, now }: TodayStatusCardProps) {
  const streak = useMemo(() => calcStreak(recordByDate, now), [recordByDate, now]);
  const bestStreak = useMemo(() => calcBestStreak(recordByDate), [recordByDate]);
  const config = todayRecord ? STATUS_CONFIG[todayRecord.status] : null;
  const checkedIn = !!todayRecord?.checkIn;

  const timeStr = useMemo(() => {
    if (!todayRecord) return null;
    return todayRecord.checkIn
      ? new Date(todayRecord.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
      : null;
  }, [todayRecord]);

  return (
    <div className={cn(
      'rounded-2xl border p-4 sm:p-5 transition-all',
      config ? `${config.bg} border-transparent ring-1 ${config.ring}` : 'bg-gray-50 border-gray-200',
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config?.icon ?? '⏳'}</span>
          <div>
            <p className={cn('text-lg font-bold', config?.text ?? 'text-gray-600')}>
              {todayRecord?.status ?? 'Not Marked'}
            </p>
            <p className="text-xs text-gray-500">Today&apos;s Status</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full ring-1 ring-amber-200/60">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-bold tabular-nums">{streak}</span>
              <span className="text-[10px] font-medium uppercase">streak</span>
            </div>
          )}
          {bestStreak > streak && (
            <div className="flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full ring-1 ring-primary-200/60">
              <span className="text-sm">🏆</span>
              <span className="text-sm font-bold tabular-nums">{bestStreak}</span>
              <span className="text-[10px] font-medium uppercase">best</span>
            </div>
          )}
          {checkedIn && timeStr && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-gray-700">{timeStr}</span>
            </div>
          )}
        </div>
      </div>
      {todayRecord?.remarks && (
        <p className="mt-2 text-xs text-gray-500 italic">Note: {todayRecord.remarks}</p>
      )}
    </div>
  );
});

export default TodayStatusCard;
