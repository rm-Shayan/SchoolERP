'use client';

import { useState } from 'react';
import { attendanceService } from '@/lib/api/attendanceService';
import { Modal, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import type { AttendanceStatus } from '@/types';

interface Props {
  studentId: string;
  /** Student display name (optional — header falls back to generic text). */
  studentName?: string;
  /** Current record status (optional — shown as "Currently: X"). */
  currentStatus?: string;
  /** Optional current record ID — uses PUT /attendance/:id so checkIn/checkOut are preserved. */
  recordId?: string;
  date: string;
  schoolId?: string;
  onClose: () => void;
}

const STATUSES: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'PRESENT', label: 'Present', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { value: 'LATE', label: 'Late', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 border-red-300 text-red-800' },
  { value: 'LEAVE', label: 'Leave', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { value: 'HALF_DAY', label: 'Half Day', color: 'bg-cyan-100 border-cyan-300 text-cyan-800' },
  { value: 'MANUAL_OVERRIDE', label: 'Manual Override', color: 'bg-primary-100 border-primary-300 text-primary-800' },
];

const BADGE: Record<string, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  ABSENT: 'bg-red-50 text-red-600 border-red-200',
  LEAVE: 'bg-blue-50 text-blue-700 border-blue-200',
  HALF_DAY: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  MANUAL_OVERRIDE: 'bg-primary-50 text-primary-700 border-primary-200',
};

// Backend DATE columns are stored at UTC midnight — always send clean YYYY-MM-DD.
// `new Date(iso).toISOString().slice(0, 10)` shifts to UTC (e.g. 2026-09-09T19:00:00Z
// → 09-08) so strip the date part from the raw string instead.
function normalizeDate(raw: string): string {
  const m = /^([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(raw);
  return m ? m[1] : raw;
}

export default function AttendanceOverrideModal({ studentId, studentName, currentStatus, recordId, date: rawDate, onClose }: Props) {
  const date = normalizeDate(rawDate);
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (recordId) {
        // PUT keeps checkIn / checkOut / scanLog — a scan record stays a scan record.
        await attendanceService.updateRecord(recordId, { status, remarks: remarks || undefined });
      } else {
        await attendanceService.manualOverride({ studentId, date, status, remarks: remarks || undefined });
      }
      toast.success('Attendance overridden successfully');
      onClose();
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(message ?? 'Failed to override');
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
            {studentName ? <>Override attendance for <span className="font-semibold text-gray-700">{studentName}</span> on </> : 'Override attendance for student on '}
            {new Date(date + 'T00:00:00').toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {currentStatus && (
            <p className="mt-2 text-xs text-gray-500">
              Currently:{' '}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${BADGE[currentStatus] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {currentStatus.replace('_', ' ')}
              </span>
            </p>
          )}
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
