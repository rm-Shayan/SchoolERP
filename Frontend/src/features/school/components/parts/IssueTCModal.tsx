'use client';

import { useState } from 'react';
import { Modal, Button } from '@/features/shared/components';
import { documentsApi } from '@/lib/api/documents';
import toast from 'react-hot-toast';
import type { Student } from '@/types';

const REASONS = [
  { value: 'TRANSFERRED_OUT', label: 'Transfer to Another School', description: 'Student is leaving for another school. TC will be issued.' },
  { value: 'DROPPED_OUT', label: 'Drop Out', description: 'Student is leaving school permanently. TC will be issued.' },
  { value: 'GRADUATED', label: 'Passed Out / Graduated', description: 'Student has completed the final class. TC will be issued.' },
] as const;

interface IssueTCModalProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onIssued?: () => void;
}

export default function IssueTCModal({ open, student, onClose, onIssued }: IssueTCModalProps) {
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const handleIssue = async () => {
    if (!student || !reason) return;
    setBusy(true);
    try {
      await documentsApi.issueTc(student.id, { reason, remarks: remarks || undefined });
      toast.success('TC issued and downloaded');
      setReason('');
      setRemarks('');
      onIssued?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to issue TC');
    } finally {
      setBusy(false);
    }
  };

  if (!student) return null;

  return (
    <Modal open={open} onClose={onClose} title="Issue Transfer Certificate" size="md">
      <div className="space-y-4">
        {/* Student info */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
          <p className="text-xs text-gray-500 mt-1">
            {student.section?.class?.name} — {student.section?.name} | Roll {student.rollNumber}
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Reason for Leaving</label>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  reason === r.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="tc-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-0.5 h-4 w-4 text-primary-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.label}</p>
                  <p className="text-xs text-gray-500">{r.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Remarks (optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Any additional notes for the TC..."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
          />
        </div>

        {/* Warning */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-700">
            <strong>Warning:</strong> Issuing a TC will change the student&apos;s status, deactivate their portal access, and move their photo to archive. This action creates a PromotionRecord for history tracking.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" disabled={!reason} loading={busy} onClick={handleIssue}>
            Issue TC & Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
