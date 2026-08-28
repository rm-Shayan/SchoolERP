'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, PageHeader, Button, EmptyState, Modal, ListSkeleton } from '@/features/shared/components';
import { leaveService, type LeaveRequest } from '@/lib/api/leaveService';
import toast from 'react-hot-toast';
import LeaveRequestRow from './parts/LeaveRequestRow';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

type Filter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

export default function LeaveApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [remarksModal, setRemarksModal] = useState<{ id: string; action: 'APPROVED' | 'REJECTED' } | null>(null);
  const [remarks, setRemarks] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === 'ALL' ? {} : { status: filter };
      const { data } = await leaveService.listAll(params);
      setRequests(data.data?.requests ?? []);
    } catch {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Auto-refresh when new leave requests arrive or status changes
  useRealtimeRefresh(['leave_request_created', 'leave_request_reviewed'], fetchRequests);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED', adminRemarks?: string) => {
    setReviewing(id);
    try {
      await leaveService.review(id, { status, remarks: adminRemarks || undefined });
      toast.success(`Leave ${status.toLowerCase()}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update');
    } finally {
      setReviewing(null);
      setRemarksModal(null);
      setRemarks('');
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'ALL', label: 'All' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Approvals" description="Review and approve/reject student leave requests from parents." />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f.key ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-8 px-5"><ListSkeleton count={4} /></div>
        ) : requests.length === 0 ? (
          <EmptyState icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} title="No leave requests found" description={filter === 'ALL' ? 'Parent leave requests will appear here for review.' : `No ${filter.toLowerCase()} requests right now.`} />
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => (
              <LeaveRequestRow
                key={req.id}
                req={req}
                reviewingId={reviewing}
                onApprove={(id) => handleReview(id, 'APPROVED')}
                onReject={(id) => setRemarksModal({ id, action: 'REJECTED' })}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Reject Remarks Modal — shared Modal component */}
      <Modal open={!!remarksModal} onClose={() => { setRemarksModal(null); setRemarks(''); }} title="Reject Leave Request" size="sm">
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
          rows={3}
          placeholder="Reason for rejection (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => { setRemarksModal(null); setRemarks(''); }}>Cancel</Button>
          <Button
            variant="danger"
            loading={reviewing === remarksModal?.id}
            onClick={() => remarksModal && handleReview(remarksModal.id, 'REJECTED', remarks)}
          >
            Confirm Reject
          </Button>
        </div>
      </Modal>
    </div>
  );
}
