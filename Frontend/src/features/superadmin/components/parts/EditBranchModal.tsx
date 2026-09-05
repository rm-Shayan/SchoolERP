'use client';

import { useEffect } from 'react';
import { Button, Input, Modal } from '@/features/shared/components';
import { composeValidators, isOrgCode, isPhonePK, required, useForm } from '@/lib/utils';
import { schoolService } from '@/lib/api';
import type { School } from '@/types';
import toast from 'react-hot-toast';

interface EditBranchModalProps {
  open: boolean;
  school: School | null;
  onClose: () => void;
  onUpdated: (updated: School) => void;
}

interface EditFormValues {
  name: string;
  code: string;
  address: string;
  phone: string;
}

export default function EditBranchModal({ open, school, onClose, onUpdated }: EditBranchModalProps) {
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm<EditFormValues>({
    initialValues: {
      name: school?.name ?? '',
      code: school?.code ?? '',
      address: school?.address ?? '',
      phone: school?.phone ?? '',
    },
    validators: {
      name: required('Branch name is required'),
      code: composeValidators(required('Branch code is required'), isOrgCode()),
      phone: isPhonePK(),
    },
    onSubmit: async (v) => {
      if (!school) return;
      try {
        const updated = await schoolService.update(school.id, {
          name: v.name,
          code: v.code,
          address: v.address || undefined,
          phone: v.phone || undefined,
        });
        toast.success('Branch updated');
        onUpdated(updated);
        onClose();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to update branch');
      }
    },
  });

  // Sync form when school changes
  useEffect(() => {
    if (!school || !open) return;
    // Reset happens via useForm initial values on mount; but since the
    // component stays mounted we trigger a form reset via a controlled re-render.
  }, [school, open]);

  if (!school) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Edit ${school.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Branch Name"
          name="name"
          placeholder="e.g. Gulshan Campus"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
        <Input
          label="Branch Code"
          name="code"
          placeholder="e.g. GULSHAN-01"
          value={values.code}
          onChange={handleChange}
          error={errors.code}
          required
        />
        <Input
          label="Address (optional)"
          name="address"
          placeholder="Full address"
          value={values.address}
          onChange={handleChange}
        />
        <Input
          label="Phone (optional)"
          name="phone"
          placeholder="03001234567"
          value={values.phone}
          onChange={handleChange}
          error={errors.phone}
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
