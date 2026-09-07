'use client';

import { memo, useMemo, useState } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { Card, CardContent } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/utils/subjectColors';
import WeekOverview from './WeekOverview';
import DayNav from './DayNav';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TimeSlot { time: string; sections: string[]; }
interface SubjectGroup { subjectName: string; slots: TimeSlot[]; }

function groupBySubject(slots: TimetableSlot[]): SubjectGroup[] {
  const map = new Map<string, Map<string, Set<string>>>();
  for (const s of slots) {
    const name = s.subject?.name ?? '—';
    const timeKey = `${s.startTime}|${s.endTime}`;
    const sec = s.section?.class?.name ? `${s.section.class.name}${s.section.name ? ' ' + s.section.name : ''}` : s.section?.name ?? '';
    if (!map.has(name)) map.set(name, new Map());
    const tm = map.get(name)!;
    if (!tm.has(timeKey)) tm.set(timeKey, new Set());
    if (sec) tm.get(timeKey)!.add(sec);
  }
  const groups: SubjectGroup[] = [];
  for (const [subjectName, tm] of map) {
    const slots: TimeSlot[] = [];
    for (const [tk, secs] of tm) {
      const [s, e] = tk.split('|');
      slots.push({ time: `${s}–${e}`, sections: [...secs] });
    }
    groups.push({ subjectName, slots: slots.sort((a, b) => a.time.localeCompare(b.time)) });
  }
  return groups.sort((a, b) => a.slots[0]?.time.localeCompare(b.slots[0]?.time) ?? 0);
}


interface Props { slots: TimetableSlot[]; }

const TodayTimetable = memo(function TodayTimetable({ slots }: Props) {
  const now = useMemo(() => new Date(), []);
  const [dayOffset, setDayOffset] = useState(0);
  const [weekView, setWeekView] = useState(false);
  const todayDow = now.getDay() === 0 ? 7 : now.getDay();

  const targetDay = useMemo(() => {
    const d = new Date(now); d.setDate(now.getDate() + dayOffset);
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    return { dow, label: `${DAY_NAMES[dow]}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` };
  }, [now, dayOffset]);

  const isToday = dayOffset === 0;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dayRawSlots = useMemo(
    () => slots.filter((s) => s.dayOfWeek === targetDay.dow).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots, targetDay.dow],
  );
  const grouped = useMemo(() => groupBySubject(dayRawSlots), [dayRawSlots]);

  const currentGroupIdx = useMemo(() => {
    if (!isToday) return -1;
    return grouped.findIndex((g) => g.slots.some((s) => {
      const [start, end] = s.time.split('–');
      return start <= currentTime && currentTime <= end;
    }));
  }, [grouped, isToday, currentTime]);

  const nextGroup = isToday ? grouped.find((g) => g.slots[0]?.time.split('–')[0] > currentTime) : null;
  const jumpToDay = (dow: number) => setDayOffset(dow - todayDow);

  return (
    <Card>        <CardContent className="p-3 sm:p-5">
          <DayNav targetDow={targetDay.dow} label={targetDay.label} isToday={isToday}
            onPrev={() => setDayOffset((o) => o - 1)}
            onNext={() => setDayOffset((o) => o + 1)} onJump={(d) => { setWeekView(false); jumpToDay(d); }}
            onBackToToday={() => setDayOffset(0)} />

          <div className="flex justify-end mb-3">
            <button onClick={() => setWeekView((v) => !v)}
              className={cn('px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all', weekView ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
              {weekView ? '📅 Day' : '📋 Week'}
            </button>
          </div>

          {weekView ? (
            <WeekOverview slots={slots} todayDow={todayDow} onDayClick={(dow) => { setWeekView(false); jumpToDay(dow); }} />
          ) : grouped.length === 0 ? (
            <div className="py-6 sm:py-8 text-center">
              <p className="text-2xl mb-1">📚</p>
              <p className="text-sm text-gray-500">{isToday ? `Enjoy your ${DAY_NAMES[targetDay.dow]}!` : `No classes on ${DAY_NAMES[targetDay.dow]}.`}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {grouped.map((g, idx) => {
                const isCurrent = idx === currentGroupIdx;
                const isPast = idx < currentGroupIdx || (currentGroupIdx === -1 && isToday && g.slots[0]?.time.split('–')[1] < currentTime);
                const sc = getSubjectColor(g.subjectName);
                const timesText = g.slots.map((s) => s.time).join(', ');
                const sectionsText = g.slots.flatMap((s) => s.sections).join(', ');
                return (
                  <div key={g.subjectName} className={cn('flex items-start gap-2.5 rounded-xl border px-3 py-2 transition-all',
                    isCurrent && 'bg-primary-50 ring-1 ring-primary-200/60 shadow-sm border-primary-200',
                    isPast && !isCurrent && cn('opacity-50', sc.bg, sc.border),
                    !isPast && !isCurrent && cn(sc.bg, sc.border))}>
                    <span className={cn('text-[10px] font-bold w-4 text-center shrink-0 mt-0.5', isCurrent ? 'text-primary-500' : 'text-gray-400')}>
                      {isCurrent ? '▶' : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-bold truncate', isCurrent ? 'text-primary-700' : isPast ? cn(sc.text, 'line-through') : sc.text)}>
                          {g.subjectName}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary-100 text-[9px] font-bold text-primary-700 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />NOW
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{timesText}</p>
                      {sectionsText && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sectionsText}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!weekView && nextGroup && (
            <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
              Next: <span className="font-medium text-gray-600">{nextGroup.subjectName}</span> at {nextGroup.slots[0]?.time.split('–')[0]}
            </p>
          )}
        </CardContent>
    </Card>
  );
});

export default TodayTimetable;
