'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { leaveService } from '@/lib/api';
import type { LeaveRequest } from '@/lib/api/leaveService';
import {
  PageHeader, Button, Card, CardContent, Badge, EmptyState, Pagination, Select,
} from '@/features/shared/components';
import LeaveRequestCard from './parts/LeaveRequestCard';
import LeaveReviewModal from './parts/LeaveReviewModal';
import CreateStudentLeaveModal from './parts/CreateStudentLeaveModal';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function StudentLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reviewLeave, setReviewLeave] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveService.listAll({ status: statusFilter || undefined, page, limit: 15 });
      const data = res.data.data;
      setRequests(data.requests);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err: any) { toast.error(err?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this leave request?')) return;
    try {
      await leaveService.delete(id);
      toast.success('Leave deleted');
      load();
    } catch (err: any) { toast.error(err?.message ?? 'Failed to delete'); }
  };

  const pending = useMemo(() => requests.filter((r) => r.status === 'PENDING'), [requests]);

  return (
    <div className="space-y-6">
      <PageHeader title="Student Leave Approvals" description="Create, review and manage student leave requests."
        actions={<>
          <Badge variant="info">{pending.length} Pending</Badge>
          <Button size="sm" onClick={() => setShowCreate(true)}>+ Create Leave</Button>
        </>}
      />
      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-48">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} placeholder="Filter by status" />
        </div>
      </div>
      {loading ? (
        <Card><CardContent><div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div></CardContent></Card>
      ) : requests.length === 0 ? (
        <Card><EmptyState title="No leave requests" description="No leave requests found matching your filters." /></Card>
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((req) => (
              <LeaveRequestCard key={req.id} req={req}
                onApprove={(r) => { setReviewLeave(r); setReviewAction('APPROVED'); }}
                onReject={(r) => { setReviewLeave(r); setReviewAction('REJECTED'); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={15} onPageChange={setPage} />
        </>
      )}
      <LeaveReviewModal leave={reviewLeave} action={reviewAction}
        onClose={() => setReviewLeave(null)} onDone={load} reviewFn={(id, d) => leaveService.review(id, d as any)}
      />
      <CreateStudentLeaveModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
    </div>
  );
}
