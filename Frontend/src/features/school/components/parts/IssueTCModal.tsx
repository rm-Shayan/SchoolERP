'use client';

import { useState } from 'react';
import { Modal, Button, Card, CardHeader, CardContent, Badge } from '@/features/shared/components';
import { studentService } from '@/lib/api';
import { documentsApi } from '@/lib/api/documents';
import toast from 'react-hot-toast';
import type { Student } from '@/types';

const EXIT_OPTIONS = [
  { value: 'TRANSFERRED_OUT', label: 'Transfer to Another School', note: 'A Transfer Certificate (TC) will be available to download after exit.' },
  { value: 'DROPPED_OUT', label: 'Drop Out', note: 'A Dropout Letter will be available. No TC is issued for dropouts.' },
  { value: 'GRADUATED', label: 'Passed Out / Graduated', note: 'A Passed Out Letter will be available.' },
] as const;

interface Props { open: boolean; student: Student | null; onClose: () => void; onIssued?: () => void; }

export default function IssueTCModal({ open, student, onClose, onIssued }: Props) {
  const [exitType, setExitType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const isActive = student?.status === 'ACTIVE';
  const isTransferred = student?.status === 'TRANSFERRED_OUT' && !student?.transferCertificate;
  const title = isTransferred ? 'Issue Transfer Certificate' : 'Exit Student';

  const handleSubmit = async () => {
    if (!student) return;
    const targetStatus = isTransferred ? 'TRANSFERRED_OUT' : exitType;
    if (!targetStatus) return;
    setBusy(true);
    try {
      if (isTransferred) {
        await documentsApi.issueTc(student.id, { reason: 'TRANSFERRED_OUT', remarks: remarks || undefined });
        toast.success('Transfer Certificate issued and downloaded');
      } else {
        await studentService.updateStatus(student.id, targetStatus as Student['status'], remarks || undefined);
        const label = targetStatus === 'DROPPED_OUT' ? 'Dropout' : targetStatus === 'GRADUATED' ? 'Passed Out' : 'Transferred';
        toast.success(`${student.firstName} ${student.lastName} marked as ${label}`);
      }
      setExitType(''); setRemarks(''); onIssued?.(); onClose();
    } catch (err: any) {
      let msg = 'Operation failed';
      try {
        const d = err?.response?.data;
        if (d instanceof Blob) { const t = await d.text(); const p = JSON.parse(t); if (p?.message) msg = p.message; }
        else if (d?.message) msg = d.message;
      } catch { /* keep default */ }
      toast.error(msg);
    } finally { setBusy(false); }
  };

  if (!student) return null;

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className="space-y-5">
        <Card className="bg-gradient-to-br from-gray-50/90 to-white">
          <CardHeader className="border-b-gray-100/80">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Student</p>
              <Badge variant={isActive ? 'success' : 'warning'}>{student.status.replace(/_/g, ' ')}</Badge>
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

        {isActive && EXIT_OPTIONS.map((opt) => (
          <button key={opt.value} type="button" onClick={() => setExitType(opt.value)} className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${exitType === opt.value ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <p className={`text-sm font-semibold ${exitType === opt.value ? 'text-primary-700' : 'text-gray-800'}`}>{opt.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{opt.note}</p>
          </button>
        ))}

        {isTransferred && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm font-semibold text-amber-700">Issue Transfer Certificate</p>
            <p className="text-xs text-amber-600 mt-1">This will generate and download the TC for {student.firstName} {student.lastName}.</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Remarks <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} maxLength={500}
            placeholder={isTransferred ? 'Transfer remarks...' : 'Reason or notes...'}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none transition-shadow"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{remarks.length}/500</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={busy} className="w-full sm:w-auto">Cancel</Button>
          <Button variant="danger" disabled={!(isTransferred || exitType) || busy} loading={busy} onClick={handleSubmit} className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
            {busy ? 'Processing...' : isTransferred ? 'Issue TC & Download' : 'Confirm Exit'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}