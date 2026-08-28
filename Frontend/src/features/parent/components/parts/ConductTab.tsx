'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, EmptyState } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalConductRemark } from '@/types/portal';
import { cn, formatDate } from '@/lib/utils';
import { ConductSkeleton } from './PortalSkeletonsB';

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  POSITIVE: { bg: 'bg-green-100', text: 'text-green-700', icon: '★' },
  NEGATIVE: { bg: 'bg-red-100', text: 'text-red-700', icon: '!' },
  NEUTRAL: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '•' },
  WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⚠' },
  PRAISE: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '★' },
};

function getTypeStyle(type: string) {
  return TYPE_STYLES[type] ?? { bg: 'bg-gray-100', text: 'text-gray-600', icon: '•' };
}

export default function ConductTab() {
  const [remarks, setRemarks] = useState<PortalConductRemark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalDataService.getConduct().then(setRemarks).finally(() => setLoading(false));
  }, []);

  if (loading) return <ConductSkeleton />;

  if (remarks.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState title="No remarks yet" description="Teacher conduct remarks will appear here." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {remarks.map((r) => {
        const style = getTypeStyle(r.type);
        return (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0', style.bg, style.text)}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', style.bg, style.text)}>
                      {r.type}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{r.comment}</p>
                  <p className="text-xs text-gray-500 mt-1">By {r.teacher.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
