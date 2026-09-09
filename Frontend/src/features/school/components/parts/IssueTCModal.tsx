'use client';

import { useState } from 'react';
import { Modal, Button, Card, CardHeader, CardContent, Badge } from '@/features/shared/components';
import { documentsApi } from '@/lib/api/documents';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import toast from 'react-hot-toast';
import type { Student } from '@/types';
import ReasonSelector, { ImpactBanner } from './IssueTCReasonSelector';

const REASONS = [
  { value: 'TRANSFERRED_OUT', label: 'Transfer to Another School' },
  { value: 'DROPPED_OUT', label: 'Drop Out' },
  { value: 'GRADUATED', label: 'Passed Out / Graduated' },
] as const;

interface Props { open: boolean; student: Student | null; onClose: () => void; onIssued?: () => void; }

export default function IssueTCModal({ open, student, onClose, onIssued }: Props) {
  const { isReceptionist } = useRoleAccess();
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const isReissue = student != null && student.status !== 'ACTIVE';
  const canIssue = student?.status === 'ACTIVE';
  const selectedLabel = REASONS.find((r) => r.value === reason)?.label ?? '—';

  const handleIssue = async () => {
    if (!student || !reason) return;
    setBusy(true);
    try {
      await documentsApi.issueTc(student.id, { reason, remarks: remarks || undefined });
      toast.success('Transfer Certificate issued and downloaded');
      setReason(''); setRemarks(''); onIssued?.(); onClose();
    } catch (err: any) {
      let msg = 'Failed to issue Transfer Certificate';
      try {
        const d = err?.response?.data;
        if (d instanceof Blob) { const t = await d.text(); const p = JSON.parse(t); if (p?.message) msg = p.message; }
        else if (d?.message) msg = d.message;
      } catch { /* keep default */ }
      toast.error(msg);
    }
    finally { setBusy(false); }
  };

  if (!student) return null;

  return (
    <Modal open={open} onClose={onClose} title="Issue Transfer Certificate" size="md">
      <div className="space-y-5">
        <Card className={isReceptionist ? 'bg-primary-50/80 border-primary-200/70' : 'bg-gray-50/80 border-gray-200/70'}>
          <CardContent className="flex flex-wrap items-center gap-2 py-3">
            <Badge variant={isReceptionist ? 'default' : 'info'}>{isReceptionist ? 'Receptionist' : 'Admin'}</Badge>
            <span className="text-sm text-gray-600">              {isReceptionist
                ? 'You can issue TC for active students and reactivate any student.'
                : 'Issue TC for active students and reactivate any student.'}</span>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50/90 to-white">
          <CardHeader className="border-b-gray-100/80">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Student</p>
              <Badge variant={canIssue ? 'success' : 'info'}>{student.status.replace('_', ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-base font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Class / Section</p>
                <p className="font-medium text-gray-800">{student.section?.class?.name ? `${student.section.class.name} — ${student.section.name}` : 'Not assigned'}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Roll Number</p>
                <p className="font-medium text-gray-800">{student.rollNumber || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ReasonSelector reason={reason} onReason={setReason} canIssue={!!canIssue} isReceptionist={isReceptionist} />

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Remarks <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} maxLength={500} placeholder="Any additional notes for the Transfer Certificate..." className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none transition-shadow" />
          <p className="mt-1 text-right text-xs text-gray-400">{remarks.length}/500</p>
        </div>

        <ImpactBanner selectedLabel={selectedLabel} />

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={busy} className="w-full sm:w-auto">Cancel</Button>
          <Button variant={isReissue ? 'outline' : 'danger'} disabled={!reason || !canIssue} loading={busy} onClick={handleIssue} className={isReissue ? 'w-full sm:w-auto' : 'w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/20'}>
            {busy ? 'Processing...' : isReissue ? 'Re-issue TC & Download' : 'Issue TC & Download'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
