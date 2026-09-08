'use client';

import { useState } from 'react';
import { Modal, Button, Card, CardHeader, CardContent, Badge } from '@/features/shared/components';
import { documentsApi } from '@/lib/api/documents';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import toast from 'react-hot-toast';
import type { Student } from '@/types';

const REASONS = [
  {
    value: 'TRANSFERRED_OUT',
    label: 'Transfer to Another School',
    description: 'Student is leaving for another school. TC will be issued and the record will be archived.',
    variant: 'warning' as const,
  },
  {
    value: 'DROPPED_OUT',
    label: 'Drop Out',
    description: 'Student is leaving school permanently. TC will be issued and the record will be archived.',
    variant: 'danger' as const,
  },
  {
    value: 'GRADUATED',
    label: 'Passed Out / Graduated',
    description: 'Student has completed the final class. TC will be issued and the record will be archived.',
    variant: 'info' as const,
  },
] as const;

interface IssueTCModalProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onIssued?: () => void;
}

export default function IssueTCModal({ open, student, onClose, onIssued }: IssueTCModalProps) {
  const { isReceptionist, isAdmin } = useRoleAccess();
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const isReissue = student != null && student.status !== 'ACTIVE';
  const selectedReason = REASONS.find((r) => r.value === reason);

  const handleIssue = async () => {
    if (!student || !reason) return;
    setBusy(true);
    try {
      await documentsApi.issueTc(student.id, { reason, remarks: remarks || undefined });
      toast.success('Transfer Certificate issued and downloaded');
      setReason('');
      setRemarks('');
      onIssued?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to issue Transfer Certificate');
    } finally {
      setBusy(false);
    }
  };

  if (!student) return null;

  const isStudentActive = student.status === 'ACTIVE';
  // TC issuance is only for ACTIVE students — issuing a TC changes the student's
  // status, so it only makes sense for students who are currently active.
  // Receptionist and admin both follow the same rule here; re-issuing an
  // already-issued TC is not supported from this modal.
  const canIssue = isStudentActive;
  const roleBadge = isReceptionist
    ? { label: 'Receptionist', variant: 'default' as const }
    : { label: 'Admin', variant: 'info' as const };

  return (
    <Modal open={open} onClose={onClose} title="Issue Transfer Certificate" size="md">
      <div className="space-y-5">
        {/* Role + scope banner */}
        <Card className={isReceptionist ? 'bg-primary-50/80 border-primary-200/70' : 'bg-gray-50/80 border-gray-200/70'}>
          <CardContent className="flex flex-wrap items-center gap-2 py-3">
            <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
            <span className="text-sm text-gray-600">
              {isReceptionist
                ? 'You can issue TC for active students only.'
                : 'Issue Transfer Certificate for active students.'}
            </span>
          </CardContent>
        </Card>

        {/* Student identity card */}
        <Card className="bg-gradient-to-br from-gray-50/90 to-white">
          <CardHeader className="border-b-gray-100/80">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Student</p>
              <Badge variant={student.status === 'ACTIVE' ? 'success' : 'info'}>{student.status.replace('_', ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-base font-semibold text-gray-900">
              {student.firstName} {student.lastName}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Class / Section</p>
                <p className="font-medium text-gray-800">
                  {student.section?.class?.name ? `${student.section.class.name} — ${student.section.name}` : 'Not assigned'}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Roll Number</p>
                <p className="font-medium text-gray-800">{student.rollNumber || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reason selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Reason for Leaving *
          </label>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`relative flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all duration-200 ${
                  reason === r.value
                    ? 'border-primary-500 bg-primary-50/70 shadow-[0_4px_14px_-2px_rgba(124,58,237,0.18)] ring-2 ring-primary-200/40'
                    : 'border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {reason === r.value && (
                  <span className="absolute -top-2.5 -right-2.5 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Selected
                  </span>
                )}
                <input
                  type="radio"
                  name="tc-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-0.5 h-4 w-4 text-primary-600 accent-primary-600"
                  disabled={!canIssue}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                    <Badge variant={r.variant}>{r.value.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                </div>
              </label>
            ))}
          </div>
          {isReceptionist && !isStudentActive && (
            <p className="mt-2 text-xs text-red-600">
              This student is not active, so TC cannot be issued from the receptionist view.
            </p>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Remarks <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Any additional notes for the Transfer Certificate..."
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none transition-shadow"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{remarks.length}/500</p>
        </div>

        {/* Impact banner */}
        <Card className="bg-amber-50/80 border-amber-200/70">
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">What happens after issuing</p>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <ul className="space-y-1.5 text-xs text-amber-800">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Student status will change to <strong>{selectedReason?.label ?? '—'}</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Student + parent portal access will be deactivated.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Student photo will be moved to archive.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>A Transfer Certificate PDF will be generated and downloaded.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={busy} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant={isReissue ? 'outline' : 'danger'}
            disabled={!reason || !canIssue}
            loading={busy}
            onClick={handleIssue}
            className={isReissue ? 'w-full sm:w-auto' : 'w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/20'}
          >
            {busy ? 'Processing...' : isReissue ? 'Re-issue TC & Download' : 'Issue TC & Download'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
