'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '@/features/shared/components';
import { staffLeaveService } from '@/lib/api';
import type { StaffLeaveRequest } from '@/lib/api/staffLeaveService';
import toast from 'react-hot-toast';

const LEAVE_TYPES = [
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'PERSONAL', label: 'Personal Leave' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
];

interface Props {
  leave: StaffLeaveRequest | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditStaffLeaveModal({ leave, onClose, onUpdated }: Props) {
  const [form, setForm] = useState({ dateFrom: '', dateTo: '', leaveType: 'CASUAL', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (leave) {
      setForm({
        dateFrom: leave.date?.slice(0, 10) ?? '',
        dateTo: leave.dateTo?.slice(0, 10) ?? '',
        leaveType: leave.leaveType ?? 'CASUAL',
        reason: leave.reason ?? '',
      });
    }
  }, [leave]);

  const handleSubmit = async () => {
    if (!form.dateFrom || !form.dateTo || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await staffLeaveService.updateOwn(leave!.id, form);
      toast.success('Leave request updated');
      onClose();
      onUpdated();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to update'); }
    finally { setSubmitting(false); }
  };

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <Modal open={!!leave} onClose={onClose} title="Edit Leave Request">
      <div className="space-y-4">
        <Input label="From Date" type="date" required value={form.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} />
        <Input label="To Date" type="date" required value={form.dateTo} onChange={(e) => update('dateTo', e.target.value)} />
        <Select label="Leave Type" options={LEAVE_TYPES} value={form.leaveType} onChange={(e) => update('leaveType', e.target.value)} />
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
          <textarea className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
            rows={3} value={form.reason} onChange={(e) => update('reason', e.target.value)} placeholder="Reason for leave..." />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}
