'use client';

import { useEffect, useState } from 'react';
import { useMemo } from 'react';
import { Card, CardContent, EmptyState } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalCircular } from '@/types/portal';
import { formatDate } from '@/lib/utils';
import { NoticesSkeleton } from './PortalSkeletonsB';
import { usePortalEvents } from '@/hooks/usePortalEvents';

export default function NoticesTab() {
  const [items, setItems] = useState<PortalCircular[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalDataService.getCirculars().then(setItems).finally(() => setLoading(false));
  }, []);

  const { circularEvents } = usePortalEvents();

  // Merge socket circulars with fetched data (socket first, deduped)
  const allItems = useMemo(() => {
    const socketItems: PortalCircular[] = circularEvents.map((ev) => ({
      id: ev.id, title: ev.title, content: ev.content,
      mediaUrl: ev.mediaUrl, audience: ev.audience, createdAt: ev.createdAt,
    }));
    const ids = new Set(socketItems.map((s) => s.id));
    const existing = items.filter((i) => !ids.has(i.id));
    return [...socketItems, ...existing];
  }, [items, circularEvents]);

  if (loading) return <NoticesSkeleton />;

  if (allItems.length === 0) {
    return <Card className="p-8"><EmptyState title="No notices yet" description="School circulars will appear here." /></Card>;
  }

  return (
    <div className="space-y-3">
      {allItems.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{c.title}</h3>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{c.content}</p>
                {c.mediaUrl && (
                  <a href={c.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline mt-2 inline-block">
                    View attachment →
                  </a>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                  {c.audience}
                </span>
                <p className="text-xs text-gray-400 mt-1">{formatDate(c.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
