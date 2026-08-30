'use client';

import { memo } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { Card, CardContent } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/utils/subjectColors';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_COLS = [1, 2, 3, 4, 5, 6, 7];

interface Props {
  slots: TimetableSlot[];
  highlightDow: number;
  dates: string[];
}

const MobileTimetableCards = memo(function MobileTimetableCards({ slots, highlightDow, dates }: Props) {
  return (
    <div className="md:hidden space-y-4">
      {DAY_COLS.filter((d) => slots.some((s) => s.dayOfWeek === d)).map((d) => {
        const daySlots = slots.filter((s) => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
        const isToday = d === highlightDow;
        return (
          <Card key={d} className={cn(isToday && 'ring-2 ring-primary-200')}>
            <CardContent className="p-4">
              <h3 className={cn('text-sm font-semibold mb-1', isToday ? 'text-primary-700' : 'text-gray-700')}>
                {DAY_NAMES[d]}{isToday && ' (Today)'}
              </h3>
              <p className="text-[11px] text-gray-400 mb-3">{dates[d - 1]}</p>
              {daySlots.map((slot) => {
                const c = getSubjectColor(slot.subject?.name);
                return (
                  <div key={slot.id} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 mb-2 last:mb-0 border', c.bg, c.border)}>
                    <span className={cn('text-xs tabular-nums shrink-0', c.sub)}>{slot.startTime}</span>
                    <div className={cn('h-4 w-px shrink-0', c.border)} />
                    <div className="min-w-0">
                      <p className={cn('text-sm font-medium truncate', c.text)}>{slot.subject?.name ?? '—'}</p>
                      <p className={cn('text-[10px]', c.sub)}>{slot.section?.class?.name} {slot.section?.name}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

export default MobileTimetableCards;
