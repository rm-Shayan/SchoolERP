'use client';

import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/features/shared/components';
import { staffLeaveService } from '@/lib/api';
import toast from 'react-hot-toast';

const LEAVE_TYPES = [
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'PERSONAL', label: 'Personal Leave' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function StaffLeaveRequestModal({ open, onClose, onSubmitted }: Props) {
  const [form, setForm] = useState({ dateFrom: '', dateTo: '', leaveType: 'CASUAL', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.dateFrom || !form.dateTo || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await staffLeaveService.requestLeave(form);
      toast.success('Leave request submitted');
      setForm({ dateFrom: '', dateTo: '', leaveType: 'CASUAL', reason: '' });
      onClose();
      onSubmitted();
    } catch (err: any) { toast.error(err?.message ?? 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <Modal open={open} onClose={onClose} title="Request Leave">
      <div className="space-y-4">
        <Input label="From Date" type="date" required value={form.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} />
        <Input label="To Date" type="date" required value={form.dateTo} onChange={(e) => update('dateTo', e.target.value)} />
        <Select label="Leave Type" options={LEAVE_TYPES} value={form.leaveType} onChange={(e) => update('leaveType', e.target.value)} />
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
          <textarea className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
            rows={3} value={form.reason} onChange={(e) => update('reason', e.target.value)} placeholder="Reason for leave..."
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit}>Submit Request</Button>
        </div>
      </div>
    </Modal>
  );
}
