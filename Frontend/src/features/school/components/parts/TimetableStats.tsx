'use client';

import { memo, useMemo } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { Card } from '@/features/shared/components';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_COLS = [1, 2, 3, 4, 5, 6, 7];
const SUBJECT_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-teal-100 text-teal-700 border-teal-200',
];

interface Props { slots: TimetableSlot[]; todayDow: number; }

const TimetableStats = memo(function TimetableStats({ slots, todayDow }: Props) {
  const dayCounts = useMemo(() => {
    const m = new Map<number, number>();
    DAY_COLS.forEach((d) => m.set(d, 0));
    slots.forEach((s) => m.set(s.dayOfWeek, (m.get(s.dayOfWeek) ?? 0) + 1));
    return m;
  }, [slots]);

  const teacherCounts = useMemo(() => {
    const m = new Map<string, { name: string; count: number; subjects: Set<string> }>();
    slots.forEach((s) => {
      const existing = m.get(s.teacherId);
      if (existing) { existing.count++; if (s.subject?.name) existing.subjects.add(s.subject.name); }
      else m.set(s.teacherId, { name: s.teacher?.name ?? 'Unknown', count: 1, subjects: new Set(s.subject?.name ? [s.subject.name] : []) });
    });
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [slots]);

  const subjectCounts = useMemo(() => {
    const m = new Map<string, { count: number; days: Set<number> }>();
    slots.forEach((s) => {
      const name = s.subject?.name ?? 'Unknown';
      const existing = m.get(name);
      if (existing) { existing.count++; existing.days.add(s.dayOfWeek); }
      else m.set(name, { count: 1, days: new Set([s.dayOfWeek]) });
    });
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [slots]);

  if (slots.length === 0) return null;
  const totalSlots = slots.length;
  const uniqueSubjects = subjectCounts.length;
  const maxDay = Math.max(...DAY_COLS.map((d) => dayCounts.get(d) ?? 0));
  const maxTeacher = Math.max(...teacherCounts.map((t) => t.count), 1);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Slots per Day — enhanced */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Slots per Day</h4>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>{totalSlots} total</span>
            <span>{uniqueSubjects} subjects</span>
          </div>
        </div>
        <div className="space-y-2.5">
          {DAY_COLS.map((d, i) => {
            const count = dayCounts.get(d) ?? 0;
            const pct = maxDay > 0 ? (count / maxDay) * 100 : 0;
            const isToday = d === todayDow;
            const isEmpty = count === 0;
            return (
              <div key={d}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-[11px] font-semibold', isToday ? 'text-primary-600' : 'text-gray-600')}>{DAY_NAMES[d]}</span>
                    {isToday && <span className="text-[8px] font-bold text-primary-500 bg-primary-50 px-1 rounded">TODAY</span>}
                  </div>
                  <span className={cn('text-[11px] font-bold tabular-nums', isEmpty ? 'text-gray-300' : isToday ? 'text-primary-600' : 'text-gray-600')}>{count}</span>
                </div>
                <div className="h-3 bg-gray-50 rounded-full overflow-hidden relative">
                  <div className={cn('h-full rounded-full transition-all duration-500', isToday ? 'bg-gradient-to-r from-primary-400 to-primary-600' : i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-300')} style={{ width: `${Math.max(pct, 8)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Teacher workload — enhanced */}
      <Card className="p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Teacher Workload</h4>
        <div className="space-y-3">
          {teacherCounts.slice(0, 6).map((t, i) => {
            const pct = (t.count / maxTeacher) * 100;
            const initial = t.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={t.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0', i % 3 === 0 ? 'bg-primary-100 text-primary-700' : i % 3 === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                      {initial}
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 truncate">{t.name}</span>
                  </div>
                  <span className="text-[11px] font-bold tabular-nums text-gray-500 shrink-0">{t.count}</span>
                </div>
                <div className="h-2 bg-gray-50 rounded-full overflow-hidden ml-8">
                  <div className={cn('h-full rounded-full transition-all duration-500', i % 3 === 0 ? 'bg-primary-400' : i % 3 === 1 ? 'bg-emerald-400' : 'bg-amber-400')} style={{ width: `${Math.max(pct, 8)}%` }} />
                </div>
                {t.subjects.size > 0 && <p className="text-[9px] text-gray-400 ml-8">{[...t.subjects].join(', ')}</p>}
              </div>
            );
          })}
          {teacherCounts.length > 6 && <p className="text-[10px] text-gray-400 mt-1">+{teacherCounts.length - 6} more teachers</p>}
        </div>
      </Card>

      {/* Subject breakdown — enhanced */}
      <Card className="p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Subjects</h4>
        <div className="space-y-2">
          {subjectCounts.map(([name, { count, days }], i) => (
            <div key={name} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border transition-all', SUBJECT_COLORS[i % SUBJECT_COLORS.length])}>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold truncate">{name}</p>
                <p className="text-[9px] opacity-60">{count} {count === 1 ? 'slot' : 'slots'} · {days.size} {days.size === 1 ? 'day' : 'days'}</p>
              </div>
              <span className="text-sm font-bold tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
});

export default TimetableStats;
