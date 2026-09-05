'use client';

import { useEffect, useState } from 'react';
import { staffService, schoolService, orgService } from '@/lib/api';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import { getRoleLabel, useForm, required, isEmail, isPhonePK } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { User, Organization, School } from '@/types';

const ROLES = ['ADMIN', 'TEACHER', 'RECEPTIONIST'];

interface EditUserModalProps {
  user: User | null;
  onClose: () => void;
  onUpdated: (updated: User) => void;
}

export default function EditUserModal({ user, onClose, onUpdated }: EditUserModalProps) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setOrgsLoading(true);
    orgService.getAll().then(setOrgs).catch(() => toast.error('Failed to load organizations')).finally(() => setOrgsLoading(false));
    if (user.organizationId) {
      setSchoolsLoading(true);
      schoolService.getAll(user.organizationId).then(setSchools).catch(() => {}).finally(() => setSchoolsLoading(false));
    }
  }, [user]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      role: user?.role ?? 'TEACHER',
      organizationId: user?.organizationId ?? '',
      schoolId: user?.schoolId ?? '',
    },
    validators: {
      name: required('Full name is required'),
      email: required('Email is required'),
      role: required('Role is required'),
    },
    onSubmit: async (v) => {
      if (!user) return;
      try {
        const updated = await staffService.update(user.id, {
          name: v.name as string,
          phone: (v.phone as string).trim() || undefined,
          role: v.role as string,
        });
        toast.success(`${updated.name} updated successfully`);
        onUpdated(updated);
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to update user');
      }
    },
  });

  if (!user) return null;

  return (
    <Modal open={!!user} onClose={onClose} title={`Edit ${user.name}`}>
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
          label="Email"
          name="email"
          type="email"
          value={values.email as string}
          onChange={handleChange}
          disabled
        />
        <Input
          label="Phone"
          name="phone"
          placeholder="0300 1234567"
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
          error={errors.role}
        />
        <Select
          label="Organization"
          name="organizationId"
          placeholder={orgsLoading ? 'Loading…' : 'Select organization'}
          options={orgs.map((o) => ({ value: o.id, label: o.name }))}
          value={values.organizationId as string}
          onChange={handleChange}
        />
        <Select
          label="Branch"
          name="schoolId"
          placeholder={schoolsLoading ? 'Loading branches…' : 'Select a branch'}
          options={schools.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
          value={values.schoolId as string}
          onChange={handleChange}
          disabled={!values.organizationId}
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
