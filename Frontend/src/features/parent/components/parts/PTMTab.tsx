'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, EmptyState } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalPTMSession } from '@/types/portal';
import { cn } from '@/lib/utils';
import { PTMSkeleton } from './PortalSkeletonsB';

export default function PTMTab() {
  const [sessions, setSessions] = useState<PortalPTMSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalDataService.getPTM().then(setSessions).finally(() => setLoading(false));
  }, []);

  if (loading) return <PTMSkeleton />;

  if (sessions.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState title="No upcoming PTM sessions" description="Parent-Teacher meeting schedules will appear here." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const date = new Date(s.scheduledAt);
        const isToday = new Date().toDateString() === date.toDateString();
        return (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-center',
                  isToday ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600',
                )}>
                  <span className="text-xs font-bold leading-none">{date.toLocaleDateString('en-PK', { month: 'short' })}</span>
                  <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                  {s.description && (
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{s.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {s.location && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {s.location}
                      </span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                  isToday ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600',
                )}>
                  {isToday ? 'Today' : date.toLocaleDateString('en-PK', { weekday: 'short' })}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
