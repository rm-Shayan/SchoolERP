'use client';

import { memo, useMemo, useState } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { Card, CardContent } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import WeekOverview from './WeekOverview';
import DayTimeline, { type GroupedSlot } from './DayTimeline';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_COLS = [1, 2, 3, 4, 5, 6, 7];

function groupSlots(slots: TimetableSlot[]): GroupedSlot[] {
  const map = new Map<string, GroupedSlot>();
  for (const s of slots) {
    const key = `${s.startTime}|${s.endTime}|${s.subjectId}`;
    const secLabel = s.section ? `${s.section.class?.name ?? ''} ${s.section.name}`.trim() : '—';
    const existing = map.get(key);
    if (existing) existing.sections.push({ id: s.sectionId, label: secLabel });
    else map.set(key, { id: s.id, subjectName: s.subject?.name ?? '—', startTime: s.startTime, endTime: s.endTime, sections: [{ id: s.sectionId, label: secLabel }] });
  }
  return [...map.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function countByDay(slots: TimetableSlot[]) {
  const counts = new Map<number, number>();
  for (const s of slots) counts.set(s.dayOfWeek, (counts.get(s.dayOfWeek) ?? 0) + 1);
  return counts;
}

interface Props { slots: TimetableSlot[]; }

const TodayTimetable = memo(function TodayTimetable({ slots }: Props) {
  const now = useMemo(() => new Date(), []);
  const [dayOffset, setDayOffset] = useState(0);
  const [weekView, setWeekView] = useState(false);
  const slotCounts = useMemo(() => countByDay(slots), [slots]);
  const todayDow = now.getDay() === 0 ? 7 : now.getDay();

  const targetDay = useMemo(() => {
    const d = new Date(now); d.setDate(now.getDate() + dayOffset);
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    return { dow, label: `${DAY_NAMES[dow]}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` };
  }, [now, dayOffset]);

  const isToday = dayOffset === 0;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dayRawSlots = useMemo(() => slots.filter((s) => s.dayOfWeek === targetDay.dow).sort((a, b) => a.startTime.localeCompare(b.startTime)), [slots, targetDay.dow]);
  const grouped = useMemo(() => groupSlots(dayRawSlots), [dayRawSlots]);
  const currentIdx = isToday ? grouped.findIndex((g) => g.startTime <= currentTime && currentTime <= g.endTime) : -1;
  const nextSlot = isToday ? grouped.find((g) => g.startTime > currentTime) : null;
  const jumpToDay = (dow: number) => setDayOffset(dow - todayDow);

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setDayOffset((o) => o - 1)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-center min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{targetDay.label}</h3>
            {isToday ? <span className="text-[10px] font-bold text-primary-500">TODAY</span> : (
              <button onClick={() => setDayOffset(0)} className="text-[10px] text-primary-600 hover:text-primary-700 font-medium">← Back to today</button>
            )}
          </div>
          <button onClick={() => setDayOffset((o) => o + 1)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex gap-1">
            {DAY_COLS.map((d) => {
              const count = slotCounts.get(d) ?? 0;
              const active = d === targetDay.dow && !weekView;
              return (
                <button key={d} onClick={() => { setWeekView(false); jumpToDay(d); }}
                  className={cn('px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all', active ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                  <span className="hidden sm:inline">{DAY_NAMES[d].slice(0, 3)}</span>
                  <span className="sm:hidden">{DAY_ABBR[d]}</span>
                  {count > 0 && <span className={cn('ml-0.5 text-[8px] px-1 rounded-full font-bold', active ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500')}>{count}</span>}
                </button>
              );
            })}
          </div>
          <button onClick={() => setWeekView((v) => !v)}
            className={cn('px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0', weekView ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
            {weekView ? '📅 Day' : '📋 Week'}
          </button>
        </div>

        {weekView ? (
          <WeekOverview slots={slots} todayDow={todayDow} onDayClick={(dow) => { setWeekView(false); jumpToDay(dow); }} />
        ) : (
          <DayTimeline grouped={grouped} isToday={isToday} currentIdx={currentIdx} emptyMsg={isToday ? `Enjoy your ${DAY_NAMES[targetDay.dow]}!` : `No classes on ${DAY_NAMES[targetDay.dow]}.`} />
        )}

        {!weekView && nextSlot && (
          <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
            Next: <span className="font-medium text-gray-600">{nextSlot.subjectName}</span> at {nextSlot.startTime}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

export default TodayTimetable;
