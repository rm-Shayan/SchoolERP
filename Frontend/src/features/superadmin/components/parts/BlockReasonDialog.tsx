'use client';

import { useState } from 'react';
import { Modal, Button } from '@/features/shared/components';

interface BlockReasonDialogProps {
  open: boolean;
  title: string;
  memberName?: string;
  message: string;
  loading?: boolean;
  reasonValue?: string;
  onReasonChange?: (v: string) => void;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function BlockReasonDialog({
  open,
  title,
  message,
  loading = false,
  reasonValue = '',
  onReasonChange,
  onConfirm,
  onCancel,
}: BlockReasonDialogProps) {
  const [localReason, setLocalReason] = useState('');
  const reason = reasonValue ?? localReason;

  const handleClose = () => {
    if (loading) return;
    setLocalReason('');
    onCancel();
  };

  const handleConfirm = () => {
    onConfirm(reason);
    setLocalReason('');
    onReasonChange?.('');
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} size="sm">
      <div className="text-sm text-gray-600 leading-relaxed">{message}</div>
      <label className="block mt-4">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Block reason (optional admin note)</span>
        <textarea
          value={reason}
          onChange={(e) => { setLocalReason(e.target.value); onReasonChange?.(e.target.value); }}
          rows={3}
          maxLength={500}
          placeholder="e.g. Payment overdue / policy violation"
          className="mt-2 w-full rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100/80 outline-none resize-none"
        />
        <p className="mt-1 text-xs text-gray-400 text-right tabular-nums">{reason.length}/500</p>
      </label>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5">
        <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="button" variant="danger" loading={loading} onClick={handleConfirm}>
          Block
        </Button>
      </div>
    </Modal>
  );
}
