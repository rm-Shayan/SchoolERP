'use client';

import type { LeaveRequest } from '@/lib/api/leaveService';
import { Card, CardContent, Badge, Button } from '@/features/shared/components';

const statusBadge = (s: string) => {
  if (s === 'APPROVED') return <Badge variant="success">Approved</Badge>;
  if (s === 'REJECTED') return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
};

interface Props {
  req: LeaveRequest;
  onApprove: (r: LeaveRequest) => void;
  onReject: (r: LeaveRequest) => void;
  onDelete: (id: string) => void;
}

export default function LeaveRequestCard({ req, onApprove, onReject, onDelete }: Props) {
  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">
              {req.student?.firstName} {req.student?.lastName}
            </span>
            {statusBadge(req.status)}
            <span className="text-xs text-gray-400">
              {req.student?.section?.class?.name} - {req.student?.section?.name}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{req.reason}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(req.dateFrom).toLocaleDateString('en-PK')} → {new Date(req.dateTo).toLocaleDateString('en-PK')}
            {' · '}Requested by {req.parent?.name}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {req.status === 'PENDING' && (
            <>
              <Button size="sm" onClick={() => onApprove(req)}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => onReject(req)}>Reject</Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => onDelete(req.id)} className="text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
