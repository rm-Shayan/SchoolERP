'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import type { PTMEvent } from '@/lib/api/ptmService';
import { Card, CardContent, EmptyState, Badge } from '@/features/shared/components';
import { formatDate } from '@/lib/utils';

interface UpcomingPtmsProps {
  sessions: PTMEvent[];
}

const UpcomingPtms = memo(function UpcomingPtms({ sessions }: UpcomingPtmsProps) {
  const upcoming = useMemo(() => {
    const now = new Date();
    return sessions
      .filter((s) => new Date(s.scheduledAt) >= now && s.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5);
  }, [sessions]);

  if (upcoming.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <EmptyState title="No upcoming PTMs" description="You have no scheduled parent-teacher meetings." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Upcoming PTMs</h3>
          <Link href="/teacher/ptm" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all</Link>
        </div>
        {upcoming.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(s.scheduledAt)}{s.venue ? ` · ${s.venue}` : ''}</p>
            </div>
            <Badge variant="info">{s.scope === 'WHOLE_SCHOOL' ? 'All' : s.scopeLabel ?? 'PTM'}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

export default UpcomingPtms;
