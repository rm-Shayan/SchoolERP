'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal, Button, Input, Select } from '@/features/shared/components';
import { leaveService, studentService } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved (Auto)' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateStudentLeaveModal({ open, onClose, onCreated }: Props) {
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string; section?: { class?: { name: string }; name: string } }[]>([]);
  const [form, setForm] = useState({ studentId: '', dateFrom: '', dateTo: '', reason: '', status: 'PENDING' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const items = await studentService.getAll({ pageSize: 500 });
      setStudents(items ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [open]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName}${s.section ? ` (${s.section.class?.name || ''} ${s.section.name || ''})` : ''}`,
  }));

  const handleSubmit = async () => {
    if (!form.studentId || !form.dateFrom || !form.dateTo || !form.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await leaveService.adminCreate(form);
      toast.success('Leave created');
      setForm({ studentId: '', dateFrom: '', dateTo: '', reason: '', status: 'PENDING' });
      onClose();
      onCreated();
    } catch (err: any) { toast.error(err?.message ?? 'Failed'); }
    finally { setSubmitting(false); }
  };

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Create Student Leave">
      <div className="space-y-4">
        <Select label="Student" options={studentOptions} value={form.studentId}
          onChange={(e) => update('studentId', e.target.value)} placeholder="Select student..." loading={loading} required />
        <Input label="From Date" type="date" required value={form.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} />
        <Input label="To Date" type="date" required value={form.dateTo} onChange={(e) => update('dateTo', e.target.value)} />
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
