'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import type { Homework } from '@/lib/api/homeworkService';
import { Card, CardContent, EmptyState } from '@/features/shared/components';
import { formatDate } from '@/lib/utils';

interface RecentHomeworkProps {
  items: Homework[];
}

const RecentHomework = memo(function RecentHomework({ items }: RecentHomeworkProps) {
  const recent = useMemo(() => items.slice(0, 4), [items]);

  if (recent.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <EmptyState title="No homework yet" description="Start posting homework for your sections." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Recent Homework</h3>
          <Link href="/teacher/homework" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all</Link>
        </div>
        {recent.map((hw) => (
          <div key={hw.id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{hw.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hw.section?.class ? `${hw.section.class.name} — ${hw.section.name}` : ''}
                </p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0">{formatDate(hw.sentAt)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

export default RecentHomework;
