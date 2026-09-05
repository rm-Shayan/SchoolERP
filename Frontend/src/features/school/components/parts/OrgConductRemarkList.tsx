'use client';

import { Card, EmptyState } from '@/features/shared/components';
import type { ConductRemark } from '@/lib/api/conductService';

const TYPE_BADGE: Record<string, string> = {
  POSITIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  NEUTRAL: 'bg-gray-100 text-gray-600',
  NEGATIVE: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
};

interface Props {
  remarks: ConductRemark[];
  onEdit: (r: ConductRemark) => void;
  onDelete: (r: ConductRemark) => void;
}

/** Remark cards — org admin Conduct Remarks list ka ek item. */
export default function OrgConductRemarkList({ remarks, onEdit, onDelete }: Props) {
  if (remarks.length === 0) {
    return <Card><EmptyState title="No remarks found" description="No conduct remarks match your filters." /></Card>;
  }

  return (
    <div className="space-y-2">
      {remarks.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_BADGE[r.type] ?? TYPE_BADGE.NEUTRAL}`}>{r.type}</span>
                <span className="text-xs font-medium text-gray-700">
                  {r.student?.firstName} {r.student?.lastName}
                  {r.student?.section?.class?.name ? ` — ${r.student.section.class.name} ${r.student.section.name}` : ''}
                </span>
              </div>
              <p className="text-sm text-gray-800">{r.comment}</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-[11px] font-medium text-gray-500">by {r.teacher?.name ?? 'Unknown'}</span>
                <span className="text-[11px] text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => onEdit(r)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-primary-50 hover:text-primary-600" title="Edit">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => onDelete(r)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600" title="Delete">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
