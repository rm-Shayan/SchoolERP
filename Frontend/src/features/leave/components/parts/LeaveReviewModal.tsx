'use client';

import { useState } from 'react';
import { Modal, Button } from '@/features/shared/components';
import type { LeaveRequest } from '@/lib/api/leaveService';
import toast from 'react-hot-toast';

interface Props {
  leave: LeaveRequest | null;
  action: string;
  onClose: () => void;
  onDone: () => void;
  reviewFn: (id: string, data: { status: string; remarks?: string }) => Promise<any>;
}

export default function LeaveReviewModal({ leave, action, onClose, onDone, reviewFn }: Props) {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isApprove = action === 'APPROVED' || action === 'APPROVED_LEAVE';
  const label = isApprove ? 'Approve' : 'Reject';

  const handleSubmit = async () => {
    if (!leave) return;
    setSubmitting(true);
    try {
      await reviewFn(leave.id, { status: action, remarks: remarks || undefined });
      toast.success(`Leave ${label.toLowerCase()}d`);
      onClose();
      setRemarks('');
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!leave} onClose={onClose} title={`${label} Leave Request`}>
      {leave && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <strong>{leave.student?.firstName} {leave.student?.lastName}</strong> —{' '}
            {new Date(leave.dateFrom).toLocaleDateString('en-PK')} to {new Date(leave.dateTo).toLocaleDateString('en-PK')}
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks (optional)</label>
            <textarea
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add a note..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              variant={isApprove ? 'primary' : 'danger'}
              loading={submitting}
              onClick={handleSubmit}
            >
              {label}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
