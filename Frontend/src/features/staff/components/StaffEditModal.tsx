'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { staffService } from '@/lib/api';
import type { User } from '@/types';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import { getRoleLabel, useForm, composeValidators, required, isPhonePK } from '@/lib/utils';
import toast from 'react-hot-toast';
import StaffAssignmentManager from './StaffAssignmentManager';
import StaffPasswordReset from './parts/StaffPasswordReset';

const ROLES = ['TEACHER', 'RECEPTIONIST'];

interface StaffEditModalProps {
  open: boolean;
  member: User;
  onClose: () => void;
  onUpdated: () => void;
}

export default function StaffEditModal({ open, member, onClose, onUpdated }: StaffEditModalProps) {
  const { user, school } = useAppSelector((s) => s.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const schoolId = school?.id ?? user?.schoolId;
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: member.name, phone: member.phone ?? '', role: member.role },
    validators: {
      name: required('Full name is required'),
      phone: isPhonePK(),
      role: required('Role is required'),
    },
    onSubmit: async (v) => {
      try {
        await staffService.update(member.id, {
          name: (v.name as string).trim(),
          phone: (v.phone as string).trim() || undefined,
          role: v.role as string,
        });
        toast.success('Staff member updated');
        onUpdated();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to update staff');
      }
    },
  });

  const [deactivateReason, setDeactivateReason] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await staffService.deactivate(member.id, deactivateReason.trim() || undefined);
      toast.success('Staff member deactivated');
      setShowDelete(false);
      setDeactivateReason('');
      onUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to deactivate');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit — ${member.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          value={values.name as string}
          onChange={handleChange}
          onBlur={() => handleBlur('name')}
          error={errors.name}
          required
        />
        <Input
          label="Phone"
          name="phone"
          placeholder="03xx-xxxxxxx"
          value={values.phone as string}
          onChange={handleChange}
          onBlur={() => handleBlur('phone')}
          error={errors.phone}
        />
        <Select
          label="Role"
          name="role"
          options={ROLES.map((r) => ({ value: r, label: getRoleLabel(r) }))}
          value={values.role as string}
          onChange={handleChange}
          disabled={!isSuperAdmin}
        />
        <Input label="Email" value={member.email} disabled />

        {(values.role as string) === 'TEACHER' && schoolId && (
          <StaffAssignmentManager teacherId={member.id} schoolId={schoolId} />
        )}

        {/* Password reset — admin naya password set kare, isi se staff login karega */}
        <StaffPasswordReset member={member} />

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <div className="flex-1" />
          <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowDelete(true)}>
            Deactivate
          </Button>
        </div>
      </form>

      {showDelete && (
        <Modal open onClose={() => { setShowDelete(false); setDeactivateReason(''); }} title="Deactivate Staff" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to deactivate <strong>{member.name}</strong>? They will no longer be able to log in.
            </p>
            <Input
              label="Reason (optional)"
              name="deactivateReason"
              placeholder="e.g. Left the school, contract ended…"
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowDelete(false); setDeactivateReason(''); }}>Cancel</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deactivating…' : 'Deactivate'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
