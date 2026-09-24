'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { attendanceService } from '@/lib/api/attendanceService';
import type { AttendanceStatus } from '@/types';
import Modal from '@/features/shared/components/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
}

const STATUSES: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'Late' },
  { value: 'HALF_DAY', label: 'Half Day' },
];

export default function BulkMarkModal({ open, onClose }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [submitting, setSubmitting] = useState(false);

  const mark = async () => {
    if (!date) return;
    setSubmitting(true);
    try {
      const r = await attendanceService.bulkMarkStudents({
        date,
        status,
        remarks: `Bulk mark ${status.toLowerCase()} — all active students in school`,
      });
      toast.success(`Bulk marked ${r.marked}/${r.total} students as ${status.toLowerCase()}`);
      onClose();
    } catch {
      toast.error('Bulk mark failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk Mark Attendance" size="sm">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition-all ${
                  status === s.value
                    ? 'bg-primary-600 text-white ring-primary-600'
                    : 'bg-white text-gray-600 ring-gray-200 hover:bg-primary-50 hover:ring-primary-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Marks <b>{status.toLowerCase()}</b> for every active student in this school on the selected date.
        </p>
        <button
          onClick={mark}
          disabled={submitting}
          className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Marking…' : 'Mark All Students'}
        </button>
      </div>
    </Modal>
  );
}