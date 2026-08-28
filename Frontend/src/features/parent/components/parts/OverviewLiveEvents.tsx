'use client';

import { Card, CardContent, CardHeader } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { usePortalEvents } from '@/hooks/usePortalEvents';

export function LiveBadge() {
  const { connected } = usePortalEvents();
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300')} />
      <span className="text-gray-500">{connected ? 'Live updates active' : 'Connecting...'}</span>
    </div>
  );
}

export function RecentEvents() {
  const { attendanceEvents, homeworkEvents, circularEvents } = usePortalEvents();
  const hasAny = attendanceEvents.length || homeworkEvents.length || circularEvents.length;
  if (!hasAny) return null;
  return (
    <Card>
      <CardHeader><h3 className="font-semibold text-gray-900 text-sm">Live Activity</h3></CardHeader>
      <CardContent className="space-y-2 max-h-48 overflow-y-auto">
        {attendanceEvents.slice(0, 3).map((ev, i) => (
          <div key={`a${i}`} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-gray-700"><b>{ev.studentName}</b> marked {ev.status}</span>
          </div>
        ))}
        {homeworkEvents.slice(0, 2).map((ev) => (
          <div key={`h${ev.id}`} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <span className="text-gray-700">New homework: <b>{ev.title}</b></span>
          </div>
        ))}
        {circularEvents.slice(0, 2).map((ev) => (
          <div key={`c${ev.id}`} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
            <span className="text-gray-700">Notice: <b>{ev.title}</b></span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
