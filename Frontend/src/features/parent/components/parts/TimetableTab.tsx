'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, EmptyState } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalTimetableSlot } from '@/types/portal';
import { cn } from '@/lib/utils';
import { TimetableSkeleton } from './PortalSkeletonsB';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_COLORS = ['bg-purple-50 text-purple-700', 'bg-blue-50 text-blue-700', 'bg-green-50 text-green-700', 'bg-yellow-50 text-yellow-700', 'bg-red-50 text-red-700', 'bg-indigo-50 text-indigo-700', 'bg-gray-50 text-gray-700'];

export default function TimetableTab() {
  const [slots, setSlots] = useState<PortalTimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalDataService.getTimetable().then(setSlots).finally(() => setLoading(false));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<number, PortalTimetableSlot[]>();
    slots.forEach((s) => {
      const day = Number(s.dayOfWeek) === 0 ? 1 : Number(s.dayOfWeek);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    });
    // Sort each day's slots by startTime
    map.forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [slots]);

  if (loading) return <TimetableSkeleton />;

  if (slots.length === 0) {
    return <Card className="p-8"><EmptyState title="No timetable set" description="Your class timetable will appear here once published." /></Card>;
  }

  const activeDays = DAYS.map((_, i) => i + 1).filter((d) => byDay.has(d));

  return (
    <div className="space-y-4">
      {activeDays.map((dayIdx) => (
        <Card key={dayIdx}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('px-3 py-1 rounded-full text-xs font-bold', DAY_COLORS[dayIdx])}>
                {DAYS[dayIdx]}
              </span>
              <span className="text-xs text-gray-400">{byDay.get(dayIdx)!.length} period(s)</span>
            </div>
            <div className="space-y-2">
              {byDay.get(dayIdx)!.map((slot) => (
                <div key={slot.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-xs font-mono text-gray-500 w-20 shrink-0">
                    {slot.startTime}–{slot.endTime}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{slot.subject.name}</p>
                    <p className="text-xs text-gray-500">{slot.teacher.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
