'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { staffLeaveService } from '@/lib/api';
import type { StaffLeaveRequest } from '@/lib/api/staffLeaveService';
import {
  PageHeader, Button, Card, CardContent, EmptyState, Pagination, Select,
} from '@/features/shared/components';
import StaffLeaveCard from './parts/StaffLeaveCard';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import CreateStaffLeaveModal from './parts/CreateStaffLeaveModal';
import StaffLeaveReviewModal from './parts/StaffLeaveReviewModal';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING_LEAVE', label: 'Pending' },
  { value: 'APPROVED_LEAVE', label: 'Approved' },
  { value: 'REJECTED_LEAVE', label: 'Rejected' },
];

export default function StaffLeavePage() {
  const { user } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [requests, setRequests] = useState<StaffLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewItem, setReviewItem] = useState<StaffLeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED_LEAVE' | 'REJECTED_LEAVE'>('APPROVED_LEAVE');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { status: statusFilter || undefined, page, limit: 15 };
      const res = isAdmin ? await staffLeaveService.listAll(params) : await staffLeaveService.getMyLeaves(params);
      const data = res.data.data;
      setRequests(data.requests);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err: any) { toast.error(err?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [statusFilter, page, isAdmin]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['staff_leave_request_created', 'staff_leave_request_reviewed', 'staff_leave_request_deleted'], load);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this leave request?')) return;
    try {
      await staffLeaveService.delete(id);
      toast.success('Leave deleted');
      load();
    } catch (err: any) { toast.error(err?.message ?? 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Leave Management" description={isAdmin ? "Create, review and manage staff leave requests." : "View and request leaves."}
        actions={<>
          <Button size="sm" onClick={() => setShowCreate(true)}>Create Request</Button>
        </>}
      />
      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-48">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} />
        </div>
      </div>
      {loading ? (
        <Card><CardContent><div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div></CardContent></Card>
      ) : requests.length === 0 ? (
        <Card><EmptyState title="No leave requests" description="No leave requests found." /></Card>
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((req) => (
              <StaffLeaveCard key={req.id} req={req} isAdmin={isAdmin}
                onApprove={(r) => { setReviewItem(r); setReviewAction('APPROVED_LEAVE'); }}
                onReject={(r) => { setReviewItem(r); setReviewAction('REJECTED_LEAVE'); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={15} onPageChange={setPage} />
        </>
      )}
      <CreateStaffLeaveModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
      <StaffLeaveReviewModal leave={reviewItem} action={reviewAction} onClose={() => setReviewItem(null)} onDone={load} />
    </div>
  );
}
