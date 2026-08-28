'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Select, Input } from '@/features/shared/components';
import { staffAttendanceService } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LEAVE', label: 'Leave' },
];

interface Props {
  record: { id: string; staffId?: string; staffName?: string; status: string; remarks?: string; date?: string } | null;
  onClose: (saved?: boolean) => void;
}

export default function StaffAttendanceEditModal({ record, onClose }: Props) {
  const [status, setStatus] = useState('PRESENT');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setRemarks(record.remarks || '');
    }
  }, [record]);

  const handleSubmit = async () => {
    if (!record) return;
    setSubmitting(true);
    try {
      await staffAttendanceService.updateRecord(record.id, { status, remarks: remarks || undefined });
      toast.success('Attendance updated');
      onClose(true);
    } catch (err: any) { toast.error(err?.message ?? 'Failed to update'); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal open={!!record} onClose={() => onClose()} title={`Edit Attendance — ${record?.staffName || ''}`}>
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          {record?.date ? new Date(record.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
        </p>
        <Select label="Status" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks..." />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onClose()}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}
