'use client';

import { useState } from 'react';
import { Modal, Button } from '@/features/shared/components';
import type { StaffLeaveRequest } from '@/lib/api/staffLeaveService';
import toast from 'react-hot-toast';

interface Props {
  leave: StaffLeaveRequest | null;
  action: 'APPROVED_LEAVE' | 'REJECTED_LEAVE';
  onClose: () => void;
  onDone: () => void;
}

export default function StaffLeaveReviewModal({ leave, action, onClose, onDone }: Props) {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!leave) return;
    setSubmitting(true);
    try {
      const { staffLeaveService } = await import('@/lib/api');
      await staffLeaveService.review(leave.id, { status: action, remarks: remarks || undefined });
      toast.success(`Leave ${action === 'APPROVED_LEAVE' ? 'approved' : 'rejected'}`);
      onClose();
      setRemarks('');
      onDone();
    } catch (err: any) { toast.error(err?.message ?? 'Failed to review'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal open={!!leave} onClose={onClose} title={`${action === 'APPROVED_LEAVE' ? 'Approve' : 'Reject'} Staff Leave`}>
      {leave && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <strong>{leave.staff?.name}</strong> ({leave.staff?.role}) —{' '}
            {new Date(leave.date).toLocaleDateString('en-PK')} to {leave.dateTo ? new Date(leave.dateTo).toLocaleDateString('en-PK') : ''}
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks (optional)</label>
            <textarea className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
              rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add a note..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant={action === 'APPROVED_LEAVE' ? 'primary' : 'danger'} loading={submitting} onClick={handleSubmit}>
              {action === 'APPROVED_LEAVE' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
