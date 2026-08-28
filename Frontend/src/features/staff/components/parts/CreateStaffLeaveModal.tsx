'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal, Button, Input, Select } from '@/features/shared/components';
import { staffLeaveService, staffService } from '@/lib/api';
import type { User } from '@/types';
import toast from 'react-hot-toast';

const LEAVE_TYPES = [
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'PERSONAL', label: 'Personal Leave' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
];

const STATUS_OPTIONS = [
  { value: 'PENDING_LEAVE', label: 'Pending' },
  { value: 'APPROVED_LEAVE', label: 'Approved (Auto)' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateStaffLeaveModal({ open, onClose, onCreated }: Props) {
  const [staff, setStaff] = useState<User[]>([]);
  const [form, setForm] = useState({ staffId: '', dateFrom: '', dateTo: '', leaveType: 'CASUAL', reason: '', status: 'PENDING_LEAVE' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const res = await staffService.getAll({ pageSize: 500 });
      setStaff(res.items.filter((s) => s.role !== 'ADMIN'));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [open]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const staffOptions = staff.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.role}${s.username ? ` · ${s.username}` : ''})`,
  }));

  const handleSubmit = async () => {
    if (!form.staffId || !form.dateFrom || !form.dateTo || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await staffLeaveService.adminCreate(form);
      toast.success('Staff leave created');
      setForm({ staffId: '', dateFrom: '', dateTo: '', leaveType: 'CASUAL', reason: '', status: 'PENDING_LEAVE' });
      onClose();
      onCreated();
    } catch (err: any) { toast.error(err?.message ?? 'Failed'); }
    finally { setSubmitting(false); }
  };

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Create Staff Leave">
      <div className="space-y-4">
        <Select label="Staff Member" options={staffOptions} value={form.staffId}
          onChange={(e) => update('staffId', e.target.value)} placeholder="Select staff..." loading={loading} required />
        <Input label="From Date" type="date" required value={form.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} />
        <Input label="To Date" type="date" required value={form.dateTo} onChange={(e) => update('dateTo', e.target.value)} />
        <Select label="Leave Type" options={LEAVE_TYPES} value={form.leaveType} onChange={(e) => update('leaveType', e.target.value)} />
        <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => update('status', e.target.value)} />
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
          <textarea className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
            rows={3} value={form.reason} onChange={(e) => update('reason', e.target.value)} placeholder="Reason..." />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit}>Create Leave</Button>
        </div>
      </div>
    </Modal>
  );
}
