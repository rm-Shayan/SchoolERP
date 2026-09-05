'use client';

import { useState } from 'react';
import { Modal, Input, Button } from '@/features/shared/components';
import { staffService } from '@/lib/api';
import { useForm, composeValidators, required, isPassword } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { User } from '@/types';

interface ResetPasswordDialogProps {
  user: User | null;
  onClose: () => void;
}

export default function ResetPasswordDialog({ user, onClose }: ResetPasswordDialogProps) {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { password: '' },
    validators: { password: composeValidators(required('Password is required'), isPassword()) },
    onSubmit: async (v) => {
      if (!user) return;
      try {
        await staffService.resetPassword(user.id, v.password as string);
        toast.success(`Password reset for ${user.name}`);
        onClose();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to reset password');
      }
    },
  });

  if (!user) return null;

  return (
    <Modal open={!!user} onClose={onClose} title="Reset Password" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Set a new password for <strong>{user.name}</strong> ({user.email}).
        </p>
        <Input
          label="New Password"
          name="password"
          type="password"
          placeholder="Minimum 6 characters"
          value={values.password as string}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
          error={errors.password}
          required
        />
        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={isSubmitting}>Reset Password</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
