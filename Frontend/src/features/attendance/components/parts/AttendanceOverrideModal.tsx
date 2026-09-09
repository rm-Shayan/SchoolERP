'use client';

import { useState } from 'react';
import { attendanceService } from '@/lib/api/attendanceService';
import { Modal, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import type { AttendanceStatus } from '@/types';

interface Props {
  studentId: string;
  date: string;
  schoolId?: string;
  onClose: () => void;
}

const STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'PRESENT', label: 'Present', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { value: 'LATE', label: 'Late', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 border-red-300 text-red-800' },
  { value: 'LEAVE', label: 'Leave', color: 'bg-primary-100 border-primary-300 text-primary-800' },
  { value: 'HALF_DAY', label: 'Half Day', color: 'bg-primary-100 border-primary-300 text-primary-800' },
  { value: 'MANUAL_OVERRIDE', label: 'Manual Override', color: 'bg-primary-100 border-primary-300 text-primary-800' },
];

// Backend DATE columns are stored at UTC midnight — always send clean YYYY-MM-DD.
// `new Date(iso).toISOString().slice(0, 10)` shifts to UTC (e.g. 2026-09-09T19:00:00Z
// → 09-08) so strip the date part from the raw string instead.
function normalizeDate(raw: string): string {
  const m = /^([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(raw);
  return m ? m[1] : raw;
}

export default function AttendanceOverrideModal({ studentId, date: rawDate, onClose }: Props) {
  const date = normalizeDate(rawDate);
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await attendanceService.manualOverride({ studentId, date, status, remarks: remarks || undefined });
      toast.success('Attendance overridden successfully');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to override');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Manual Attendance Override</h2>
          <p className="text-sm text-gray-500 mt-1">
            Override attendance for student on {new Date(date).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Set Status</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`px-3 py-2 text-sm font-medium rounded-xl border-2 transition-all ${
                  status === s.value
                    ? `${s.color} ring-2 ring-offset-1 ring-primary-300`
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Remarks (optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Reason for override..."
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>Save Override</Button>
        </div>
      </div>
    </Modal>
  );
}
