'use client';

import { useEffect, useState } from 'react';
import { promotionService, type PromotionRecord } from '@/lib/api/promotionService';
import { Card, EmptyState } from '@/features/shared/components';

const ACTION_LABEL: Record<string, string> = {
  PROMOTED: 'Promoted',
  REPEATED: 'Repeated',
  TRANSFERRED_SECTION: 'Section Transfer',
  GRADUATED: 'Graduated',
  DROPPED_OUT: 'Dropped Out',
};

const ACTION_COLOR: Record<string, string> = {
  PROMOTED: 'bg-green-100 text-green-700',
  REPEATED: 'bg-amber-100 text-amber-700',
  TRANSFERRED_SECTION: 'bg-primary-100 text-primary-700',
  GRADUATED: 'bg-primary-100 text-primary-700',
  DROPPED_OUT: 'bg-red-100 text-red-700',
};

interface PromotionHistoryProps {
  schoolId?: string;
  refreshKey?: number;
}

export function PromotionHistory({ schoolId, refreshKey = 0 }: PromotionHistoryProps) {
  const [records, setRecords] = useState<PromotionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    promotionService
      .getAll({ schoolId, page: 1, pageSize: 10 })
      .then((res) => setRecords(res.items))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [schoolId, refreshKey]);

  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Recent Promotion Activity</h3>
      </div>
      {loading ? (
        <div className="p-5 space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="h-5 w-20 bg-gray-200 rounded-full shrink-0" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-40 bg-gray-100 rounded" />
              <div className="ml-auto h-3 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <EmptyState title="No promotions yet" description="Promotion history will show up here as soon as you promote." />
      ) : (
        <ul className="divide-y divide-gray-100">
          {records.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLOR[r.action] ?? 'bg-gray-100 text-gray-700'}`}>
                {ACTION_LABEL[r.action] ?? r.action}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {r.student ? `${r.student.firstName} ${r.student.lastName}` : 'Student'}
              </span>
              <span className="text-xs text-gray-500">
                {r.fromSection ? `${r.fromSection.class?.name ?? ''} ${r.fromSection.name}` : ''}
                {r.toSection ? ` → ${r.toSection.class?.name ?? ''} ${r.toSection.name}` : ''}
              </span>
              <span className="ml-auto text-xs text-gray-400">
                {r.academicYear?.name ?? ''} · {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
