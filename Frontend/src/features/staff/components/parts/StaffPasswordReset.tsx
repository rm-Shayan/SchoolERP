'use client';

import { useState } from 'react';
import { staffService } from '@/lib/api';
import type { User } from '@/types';
import { Input, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface StaffPasswordResetProps {
  member: User;
}

/** Admin naya login password set kare — isi se wo staff member login karega. */
export default function StaffPasswordReset({ member }: StaffPasswordResetProps) {
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = async () => {
    if (newPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!confirm(`Set "${member.name}" ke liye new password?`)) return;
    setResetting(true);
    try {
      await staffService.resetPassword(member.id, newPassword.trim());
      toast.success('Password updated — staff member can now log in with it');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-800">Set New Login Password</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            label="New Password"
            name="newPassword"
            type="text"
            placeholder="Min 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex items-end pb-[2px]">
          <Button type="button" variant="outline" loading={resetting} onClick={handleResetPassword}>
            Update Password
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-400">Share it with the staff member — they can change it later from Settings.</p>
    </div>
  );
}
