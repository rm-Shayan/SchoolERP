'use client';

import { useState } from 'react';
import { Button } from '@/features/shared/components';
import { staffAttendanceService } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_BTN = [
  { value: 'PRESENT', label: 'P', full: 'Present', ring: 'ring-emerald-400', bg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', active: 'bg-emerald-500 text-white shadow-sm' },
  { value: 'LATE', label: 'L', full: 'Late', ring: 'ring-amber-400', bg: 'bg-amber-50 text-amber-700 hover:bg-amber-100', active: 'bg-amber-500 text-white shadow-sm' },
  { value: 'ABSENT', label: 'A', full: 'Absent', ring: 'ring-red-400', bg: 'bg-red-50 text-red-600 hover:bg-red-100', active: 'bg-red-500 text-white shadow-sm' },
  { value: 'LEAVE', label: 'Lv', full: 'Leave', ring: 'ring-blue-400', bg: 'bg-blue-50 text-blue-600 hover:bg-blue-100', active: 'bg-blue-500 text-white shadow-sm' },
  { value: 'HALF_DAY', label: 'HD', full: 'Half Day', ring: 'ring-cyan-400', bg: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100', active: 'bg-cyan-500 text-white shadow-sm' },
];

interface Props {
  record: { id: string; staffName: string; status: string; remarks: string };
  onClose: (saved?: boolean) => void;
}

export default function StaffAttendanceEditModal({ record, onClose }: Props) {
  const [status, setStatus] = useState(record.status);
  const [remarks, setRemarks] = useState(record.remarks || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await staffAttendanceService.updateRecord(record.id, { status, remarks });
      toast.success('Updated');
      onClose(true);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-gray-900">Edit — {record.staffName}</h3>
        <div className="flex gap-1.5">
          {STATUS_BTN.map((st) => (
            <button key={st.value} onClick={() => setStatus(st.value)} title={st.full}
              className={cn('flex-1 h-10 rounded-xl text-xs font-bold border-2 transition-all',
                status === st.value
                  ? cn(st.active, 'border-transparent ring-2 ring-offset-1', st.ring)
                  : cn('border-transparent', st.bg))}>
              {st.label}
            </button>
          ))}
        </div>
        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (optional)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-300 outline-none resize-none" rows={2} />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => onClose()}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
