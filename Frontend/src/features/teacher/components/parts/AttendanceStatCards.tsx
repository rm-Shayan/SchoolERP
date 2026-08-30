'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AttendanceStatCardsProps {
  summary: Record<string, number>;
  totalWorkingDays: number;
}

function PercentageRing({ percent, color }: { percent: number; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-[84px] h-[84px]">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle
          cx="42" cy="42" r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{Math.round(percent)}%</span>
      </div>
    </div>
  );
}

const AttendanceStatCards = memo(function AttendanceStatCards({
  summary, totalWorkingDays,
}: AttendanceStatCardsProps) {
  const present = (summary['PRESENT'] ?? 0) + (summary['LATE'] ?? 0);
  const absent = summary['ABSENT'] ?? 0;
  const leave = summary['LEAVE'] ?? 0;
  const halfDay = summary['HALF_DAY'] ?? 0;
  const late = summary['LATE'] ?? 0;
  const attendanceRate = totalWorkingDays > 0 ? (present / totalWorkingDays) * 100 : 0;

  const items = useMemo(() => [
    { label: 'Present', value: present, icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Late', value: late, icon: '⏰', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Absent', value: absent, icon: '❌', color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Leave', value: leave, icon: '🏖️', color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Half Day', value: halfDay, icon: '🔸', color: 'text-orange-600', bg: 'bg-orange-50' },
  ], [present, late, absent, leave, halfDay]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      <PercentageRing
        percent={attendanceRate}
        color={attendanceRate >= 80 ? '#10b981' : attendanceRate >= 60 ? '#f59e0b' : '#ef4444'}
      />
      <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 flex-1">
        {items.map((item) => (
          <div key={item.label} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl', item.bg)}>
            <span className="text-sm">{item.icon}</span>
            <div>
              <p className={cn('text-sm font-bold tabular-nums', item.color)}>{item.value}</p>
              <p className="text-[10px] text-gray-500 uppercase">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default AttendanceStatCards;
