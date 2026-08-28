'use client';

import { Badge, Button } from '@/features/shared/components';

type Kind = 'student' | 'staff';

interface Props {
  items: any[];
  kind: Kind;
  onApprove: (it: any) => void;
  onReject: (it: any) => void;
  onEdit: (it: any) => void;
  onDelete: (it: any) => void;
}

const statusBadge = (s: string) => {
  if (s === 'APPROVED' || s === 'APPROVED_LEAVE') return <Badge variant="success">Approved</Badge>;
  if (s === 'REJECTED' || s === 'REJECTED_LEAVE') return <Badge variant="danger">Rejected</Badge>;
  if (s === 'LEAVE') return <Badge variant="success">Leave</Badge>;
  return <Badge variant="warning">Pending</Badge>;
};

export default function LeaveTable({ items, kind, onApprove, onReject, onEdit, onDelete }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 p-8 text-center">No leave requests found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-left p-3">{kind === 'student' ? 'Student' : 'Staff'}</th>
            <th className="text-left p-3">From</th>
            <th className="text-left p-3">To</th>
            <th className="text-left p-3">Reason</th>
            <th className="text-left p-3">Status</th>
            <th className="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((it) => {
            const isPending = it.status === 'PENDING' || it.status === 'PENDING_LEAVE';
            return (
              <tr key={it.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-900">
                  {kind === 'student'
                    ? `${it.student?.firstName || ''} ${it.student?.lastName || ''}`.trim() || '—'
                    : (it.staff?.name || '—')}
                </td>
                <td className="p-3 text-gray-600">{new Date(it.dateFrom || it.date).toLocaleDateString('en-PK')}</td>
                <td className="p-3 text-gray-600">{new Date(it.dateTo || it.date).toLocaleDateString('en-PK')}</td>
                <td className="p-3 text-gray-500 max-w-[220px] truncate">{it.reason}</td>
                <td className="p-3">{statusBadge(it.status)}</td>
                <td className="p-3">
                  <div className="flex gap-1 justify-end flex-wrap">
                    {isPending && (
                      <>
                        <Button size="sm" onClick={() => onApprove(it)}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => onReject(it)}>Reject</Button>
                      </>
                    )}
                    {kind === 'student' && <Button size="sm" variant="ghost" onClick={() => onEdit(it)}>Edit</Button>}
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(it)}>Delete</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
