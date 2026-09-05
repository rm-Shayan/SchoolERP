'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, EmptyState } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalHomework } from '@/types/portal';
import { formatDate } from '@/lib/utils';
import { HomeworkSkeleton } from './PortalSkeletonsB';
import { usePortalEvents } from '@/hooks/usePortalEvents';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';
import { groupByChild, ChildSectionHeader, ChildEmptyCard, type PortalChildBrief } from './portalChildGroup';

export default function HomeworkTab({ children }: { children?: PortalChildBrief[] }) {
  const [items, setItems] = useState<PortalHomework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalDataService.getHomework().then(setItems).finally(() => setLoading(false));
  }, []);

  const { homeworkEvents } = usePortalEvents();

  const allItems = useMemo(() => {
    const socketItems: PortalHomework[] = homeworkEvents.map((ev) => ({
      id: ev.id, title: ev.title, content: ev.content, mediaUrl: ev.mediaUrl,
      sentAt: ev.sentAt, section: ev.section, createdBy: ev.createdBy,
    }));
    const ids = new Set(socketItems.map((s) => s.id));
    const existing = items.filter((i) => !ids.has(i.id));
    return [...socketItems, ...existing];
  }, [items, homeworkEvents]);

  const childGroups = useMemo(
    () => (children?.length ? groupByChild(allItems, children, (h, c) => h.section.id === c.sectionId) : []),
    [allItems, children]
  );

  const teacherGroups = useMemo(() => {
    const map = new Map<string, PortalHomework[]>();
    allItems.forEach((h) => {
      const key = h.createdBy?.name || 'Unknown Teacher';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    });
    return [...map.entries()];
  }, [allItems]);

  if (loading) return <HomeworkSkeleton />;

  if (allItems.length === 0) {
    return <Card className="p-8"><EmptyState title="No homework assigned" description="Check back later for updates." /></Card>;
  }

  if (children?.length) {
    return (
      <div className="space-y-5">
        {childGroups.length === 0 && <ChildEmptyCard message="No homework found for your children." />}
        {childGroups.map(({ child, items: hwList }) => (
          <div key={child.id}>
            <ChildSectionHeader child={child} count={hwList.length} />
            <HomeworkCards items={hwList} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teacherGroups.map(([teacher, hwList]) => (
        <Card key={teacher}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AvatarPlaceholder className="w-8 h-8 rounded-full" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{teacher}</h3>
                <p className="text-xs text-gray-500">{hwList.length} assignment(s)</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {hwList.map((hw) => <HomeworkItem key={hw.id} hw={hw} />)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HomeworkCards({ items }: { items: PortalHomework[] }) {
  return (
    <div className="space-y-3">
      {items.map((hw) => (
        <Card key={hw.id}>
          <CardContent className="p-4">
            <HomeworkItem hw={hw} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HomeworkItem({ hw }: { hw: PortalHomework }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-gray-900">{hw.title}</h4>
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(hw.sentAt)}</span>
      </div>
      <p className="text-sm text-gray-600 mt-1 line-clamp-3">{hw.content}</p>
      {hw.mediaUrl && (
        <a href={hw.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline mt-2 inline-block">
          View attachment →
        </a>
      )}
      <p className="text-xs text-gray-400 mt-2">
        {hw.section.class.name} — Section {hw.section.name}
      </p>
    </div>
  );
}
