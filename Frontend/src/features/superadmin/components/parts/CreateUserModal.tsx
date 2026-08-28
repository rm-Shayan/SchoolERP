'use client';

import { useEffect, useState } from 'react';
import { staffService, schoolService } from '@/lib/api';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import { getRoleLabel, useForm, composeValidators, required, isEmail, isPhonePK, isPassword } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { School } from '@/types';

const ROLES = ['ADMIN', 'TEACHER', 'RECEPTIONIST'];

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateUserModal({ open, onClose, onCreated }: CreateUserModalProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSchoolsLoading(true);
    schoolService
      .getAll()
      .then((items) => {
        if (!cancelled) setSchools(items);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load branches');
      })
      .finally(() => {
        if (!cancelled) setSchoolsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: '', email: '', password: '', phone: '', role: 'TEACHER', schoolId: '' },
    validators: {
      name: required('Full name is required'),
      email: composeValidators(required('Email is required'), isEmail()),
      phone: isPhonePK(),
      password: isPassword(),
      role: required('Role is required'),
      schoolId: required('Branch is required'),
    },
    onSubmit: async (v) => {
      try {
        await staffService.create({
          name: v.name as string,
          email: v.email as string,
          password: v.password as string,
          phone: (v.phone as string).trim() || undefined,
          role: v.role as string,
          schoolId: v.schoolId as string,
        });
        toast.success('Staff account created — credentials will be emailed');
        onCreated();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to create user');
      }
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Create User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          placeholder="e.g. Ayesha Khan"
          value={values.name as string}
          onChange={handleChange}
          onBlur={() => handleBlur('name')}
          error={errors.name}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="staff@school.com"
            value={values.email as string}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            required
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
        </div>
        <Input
          label="Temporary Password"
          name="password"
          type="password"
          placeholder="System generated if left blank"
          value={values.password as string}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
          error={errors.password}
        />
        <Select
          label="Branch"
          name="schoolId"
          placeholder={schoolsLoading ? 'Loading branches…' : 'Select a branch'}
          options={schools.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
          value={values.schoolId as string}
          onChange={handleChange}
          error={errors.schoolId}
        />
        <Select
          label="Role"
          name="role"
          options={ROLES.map((r) => ({ value: r, label: getRoleLabel(r) }))}
          value={values.role as string}
          onChange={handleChange}
          error={errors.role}
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Create User</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
