'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader, Button, Card, EmptyState } from '@/features/shared/components';
import { leaveService, type LeaveRequest } from '@/lib/api/leaveService';
import { staffLeaveService, type StaffLeaveRequest } from '@/lib/api/staffLeaveService';
import LeaveTable from './parts/LeaveTable';
import LeaveFormModal from './parts/LeaveFormModal';
import LeaveReviewModal from './parts/LeaveReviewModal';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import toast from 'react-hot-toast';

type Kind = 'student' | 'staff';
const STUDENT_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];
const STAFF_FILTERS = ['PENDING_LEAVE', 'APPROVED_LEAVE', 'REJECTED_LEAVE', 'ALL'];

export default function LeavePage() {
  const [kind, setKind] = useState<Kind>('student');
  const [filter, setFilter] = useState('PENDING');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [review, setReview] = useState<{ item: any; action: string } | null>(null);
  const FILTERS = kind === 'student' ? STUDENT_FILTERS : STAFF_FILTERS;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === 'ALL' ? {} : { status: filter };
      const fn = kind === 'student' ? leaveService.listAll : staffLeaveService.listAll;
      const { data } = await fn(params);
      setItems(data.data?.requests ?? []);
    } catch {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [kind, filter]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh([
    'leave_request_created', 'leave_request_updated', 'leave_request_reviewed', 'leave_request_deleted',
    'staff_leave_request_created', 'staff_leave_request_reviewed', 'staff_leave_request_deleted',
  ], load);

  const openCreate = () => { setEditItem(null); setShowForm(true); };
  const openEdit = (it: any) => { setEditItem(it); setShowForm(true); };
  const confirmDelete = async (it: any) => {
    if (!confirm('Delete this leave request?')) return;
    try {
      const fn = kind === 'student' ? leaveService.delete : staffLeaveService.delete;
      await fn(it.id);
      toast.success('Leave deleted');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to delete');
    }
  };
  const reviewFn = (id: string, d: any) =>
    kind === 'student' ? leaveService.review(id, d) : staffLeaveService.review(id, d);

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management" description="Create, approve and manage student & staff leave." />

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setKind('student')} className={tabCls(kind === 'student')}>Student Leave</button>
          <button onClick={() => setKind('staff')} className={tabCls(kind === 'staff')}>Staff Leave</button>
        </div>
        <Button onClick={openCreate}>New Leave</Button>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filterCls(filter === f)}>
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState title="No leave requests" description="Create one with the New Leave button." />
        ) : (
          <LeaveTable
            items={items}
            kind={kind}
            onApprove={(it) => setReview({ item: it, action: kind === 'student' ? 'APPROVED' : 'APPROVED_LEAVE' })}
            onReject={(it) => setReview({ item: it, action: kind === 'student' ? 'REJECTED' : 'REJECTED_LEAVE' })}
            onEdit={openEdit}
            onDelete={confirmDelete}
          />
        )}
      </Card>

      <LeaveFormModal
        open={showForm}
        kind={kind}
        editItem={editItem}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); load(); }}
      />
      <LeaveReviewModal
        leave={review?.item ?? null}
        action={review?.action ?? 'APPROVED'}
        reviewFn={reviewFn}
        onClose={() => setReview(null)}
        onDone={() => { setReview(null); load(); }}
      />
    </div>
  );
}

const tabCls = (active: boolean) =>
  `px-4 py-2 text-sm font-medium rounded-lg ${active ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`;
const filterCls = (active: boolean) =>
  `px-3 py-1.5 text-xs font-medium rounded-md ${active ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-500'}`;
