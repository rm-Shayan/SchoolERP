'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Input, Select } from '@/features/shared/components';
import { leaveService } from '@/lib/api/leaveService';
import { staffLeaveService } from '@/lib/api/staffLeaveService';
import { studentService } from '@/lib/api/studentService';
import { staffService } from '@/lib/api/staffService';
import toast from 'react-hot-toast';

type Kind = 'student' | 'staff';

interface Props {
  open: boolean;
  kind: Kind;
  editItem: any;
  onClose: () => void;
  onSaved: () => void;
}

const LEAVE_TYPES = [
  { value: 'CASUAL', label: 'Casual' },
  { value: 'SICK', label: 'Sick' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'UNPAID', label: 'Unpaid' },
];
const STUDENT_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];
const STAFF_STATUSES = [
  { value: 'PENDING_LEAVE', label: 'Pending' },
  { value: 'APPROVED_LEAVE', label: 'Approved' },
];

export default function LeaveFormModal({ open, kind, editItem, onClose, onSaved }: Props) {
  const [students, setStudents] = useState<{ value: string; label: string }[]>([]);
  const [staff, setStaff] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({ studentId: '', staffId: '', dateFrom: '', dateTo: '', reason: '', leaveType: 'CASUAL', status: 'PENDING' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    studentService.getAll({ pageSize: 100 })
      .then((r: any) => setStudents((r || []).map((s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.rollNumber})` }))))
      .catch(() => {});
    staffService.getAll({ pageSize: 100 })
      .then((r: any) => setStaff((r?.items || []).map((u: any) => ({ value: u.id, label: `${u.name} (${u.role})` }))))
      .catch(() => {});
    if (editItem) {
      setForm({
        studentId: editItem.studentId || '',
        staffId: editItem.staffId || '',
        dateFrom: (editItem.dateFrom || editItem.date || '').slice(0, 10),
        dateTo: (editItem.dateTo || '').slice(0, 10),
        reason: editItem.reason || '',
        leaveType: editItem.leaveType || 'CASUAL',
        status: editItem.status || (kind === 'staff' ? 'PENDING_LEAVE' : 'PENDING'),
      });
    } else {
      setForm({ studentId: '', staffId: '', dateFrom: '', dateTo: '', reason: '', leaveType: 'CASUAL', status: kind === 'staff' ? 'PENDING_LEAVE' : 'PENDING' });
    }
  }, [open, editItem, kind]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const statuses = kind === 'student' ? STUDENT_STATUSES : STAFF_STATUSES;

  const handleSubmit = async () => {
    if (!form.dateFrom || !form.dateTo || !form.reason) { toast.error('Fill dates and reason'); return; }
    if (kind === 'student' && !form.studentId) { toast.error('Select a student'); return; }
    if (kind === 'staff' && !form.staffId) { toast.error('Select a staff member'); return; }
    setSubmitting(true);
    try {
      if (kind === 'student') {
        const payload = { studentId: form.studentId, dateFrom: form.dateFrom, dateTo: form.dateTo, reason: form.reason, status: form.status };
        if (editItem) await leaveService.update(editItem.id, payload as any);
        else await leaveService.adminCreate(payload as any);
      } else {
        await staffLeaveService.adminCreate({ staffId: form.staffId, dateFrom: form.dateFrom, dateTo: form.dateTo, leaveType: form.leaveType, reason: form.reason, status: form.status });
      }
      toast.success(editItem ? 'Leave updated' : 'Leave created');
      onClose();
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? e?.message ?? 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`${editItem ? 'Edit' : 'New'} ${kind === 'student' ? 'Student' : 'Staff'} Leave`}>
      <div className="space-y-4">
        {kind === 'student' ? (
          <Select label="Student" value={form.studentId} onChange={(e) => set('studentId', e.target.value)} options={students} placeholder="Select student" />
        ) : (
          <Select label="Staff" value={form.staffId} onChange={(e) => set('staffId', e.target.value)} options={staff} placeholder="Select staff" />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input label="From" type="date" value={form.dateFrom} onChange={(e) => set('dateFrom', e.target.value)} />
          <Input label="To" type="date" value={form.dateTo} onChange={(e) => set('dateTo', e.target.value)} />
        </div>
        {kind === 'staff' && (
          <Select label="Leave Type" value={form.leaveType} onChange={(e) => set('leaveType', e.target.value)} options={LEAVE_TYPES} />
        )}
        <Input label="Reason" value={form.reason} onChange={(e) => set('reason', e.target.value)} />
        <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)} options={statuses} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit}>{editItem ? 'Save' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  );
}
