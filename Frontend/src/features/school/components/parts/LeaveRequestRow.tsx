'use client';

import { Button } from '@/features/shared/components';
import type { LeaveRequest } from '@/lib/api/leaveService';

const badgeMap: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

interface LeaveRequestRowProps {
  req: LeaveRequest;
  reviewingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function LeaveRequestRow({ req, reviewingId, onApprove, onReject }: LeaveRequestRowProps) {
  const studentName = req.student ? `${req.student.firstName} ${req.student.lastName}` : '—';
  const className = req.student?.section
    ? `${req.student.section.class?.name || ''} ${req.student.section.name}`.trim()
    : '—';

  return (
    <div className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-gray-900">{studentName}</span>
            <span className="text-sm text-gray-400">({className})</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeMap[req.status] || 'bg-gray-50 text-gray-600'}`}>
              {req.status}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            <span>{new Date(req.dateFrom).toLocaleDateString('en-PK')} — {new Date(req.dateTo).toLocaleDateString('en-PK')}</span>
            <span className="mx-2">•</span>
            <span>Parent: {req.parent?.name || '—'}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Reason: {req.reason}</p>
          {req.remarks && <p className="text-sm text-gray-400 mt-1">Admin note: {req.remarks}</p>}
        </div>

        {req.status === 'PENDING' && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="primary" loading={reviewingId === req.id} onClick={() => onApprove(req.id)}>
              Approve
            </Button>
            <Button size="sm" variant="danger" loading={reviewingId === req.id} onClick={() => onReject(req.id)}>
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
