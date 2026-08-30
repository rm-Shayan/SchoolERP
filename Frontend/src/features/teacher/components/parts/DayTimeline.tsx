'use client';

import { memo } from 'react';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { EmptyState } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/utils/subjectColors';

function timeToMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minsLeft(end: string) { const now = new Date(); return Math.max(0, timeToMin(end) - (now.getHours() * 60 + now.getMinutes())); }

export interface GroupedSlot {
  id: string; subjectName: string; startTime: string; endTime: string;
  sections: { id: string; label: string }[];
}

interface Props {
  grouped: GroupedSlot[];
  isToday: boolean;
  currentIdx: number;
  emptyMsg: string;
}

const DayTimeline = memo(function DayTimeline({ grouped, isToday, currentIdx, emptyMsg }: Props) {
  if (grouped.length === 0) return <EmptyState title="No classes" description={emptyMsg} />;
  const currentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />
      <div className="space-y-1.5">
        {grouped.map((g, idx) => {
          const isCurrent = idx === currentIdx;
          const isPast = idx < currentIdx || (currentIdx === -1 && isToday && g.endTime < currentTime);
          const sc = getSubjectColor(g.subjectName);
          const remaining = isCurrent ? minsLeft(g.endTime) : null;
          return (
            <div key={g.id} className="relative flex items-start gap-3 py-2">
              <div className={cn('absolute left-[-15px] top-3.5 w-2.5 h-2.5 rounded-full border-2 z-10',
                isCurrent && 'bg-primary-500 border-primary-300 shadow-[0_0_0_4px_rgba(124,58,237,0.15)] animate-pulse',
                isPast && !isCurrent && 'bg-gray-300 border-gray-200',
                !isPast && !isCurrent && 'bg-white border-gray-300')} />
              <div className={cn('flex-1 rounded-xl px-3.5 py-2.5 border transition-all',
                isCurrent && 'bg-primary-50 ring-1 ring-primary-200/60 shadow-sm border-primary-200',
                isPast && !isCurrent && cn('opacity-50', sc.bg, sc.border),
                !isPast && !isCurrent && cn(sc.bg, sc.border))}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-gray-400 w-4 text-center shrink-0">{idx + 1}</span>
                    <span className={cn('text-sm font-semibold truncate', isCurrent ? 'text-primary-700' : isPast ? cn(sc.text, 'line-through') : sc.text)}>{g.subjectName}</span>
                    {isCurrent && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-[10px] font-bold text-primary-700 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />NOW</span>}
                  </div>
                  <span className={cn('text-xs font-medium tabular-nums shrink-0', isCurrent ? 'text-primary-600' : sc.sub)}>{g.startTime}–{g.endTime}</span>
                </div>
                {g.sections.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 ml-5">
                    {g.sections.map((sec) => (
                      <span key={sec.id} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/70 text-[9px] font-medium text-gray-500 border border-gray-100">{sec.label}</span>
                    ))}
                  </div>
                )}
                {isCurrent && remaining !== null && (
                  <div className="mt-2 ml-5">
                    <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full transition-all duration-[60000ms]" style={{ width: `${Math.max(5, 100 - (remaining / timeToMin(g.endTime) * 100))}%` }} /></div>
                    <p className="text-[10px] text-primary-600 mt-0.5">{remaining} min left</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default DayTimeline;
