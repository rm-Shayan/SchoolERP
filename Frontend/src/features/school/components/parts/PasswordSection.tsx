'use client';

import { useMemo } from 'react';
import { useForm, composeValidators, required, strongPassword } from '@/lib/utils';
import { authService } from '@/lib/api';
import { Input, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';

export default function PasswordSection() {
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, reset } = useForm({
    initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      oldPassword: required('Current password is required'),
      newPassword: composeValidators(required('New password is required'), strongPassword()),
      confirmPassword: composeValidators(
        required('Confirm your new password'),
        (value, all) => (value === all.newPassword ? undefined : 'Passwords do not match')
      ),
    },
    onSubmit: async (v) => {
      try {
        await authService.changePassword({
          oldPassword: v.oldPassword as string,
          newPassword: v.newPassword as string,
        });
        toast.success('Password changed. Please sign in again on all devices.');
        reset();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to change password');
      }
    },
  });

  const strength = useMemo(() => {
    const val = values.newPassword as string;
    if (!val) return { width: '0%', bar: 'bg-gray-200', label: '', text: 'text-gray-400' };
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score += 1;
    if (/\d/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;
    const bar = score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-yellow-500' : score === 3 ? 'bg-blue-500' : 'bg-green-500';
    const text = score <= 1 ? 'text-red-600' : score === 2 ? 'text-yellow-600' : score === 3 ? 'text-blue-600' : 'text-green-600';
    const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';
    return { width: `${(score / 4) * 100}%`, bar, label, text };
  }, [values.newPassword]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
          <p className="text-sm text-gray-500">Use 8+ chars with uppercase, lowercase and a number.</p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/60">
        <p className="text-xs text-amber-700 font-medium">Changing your password will sign you out of all devices.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          name="oldPassword"
          placeholder="••••••••"
          value={values.oldPassword as string}
          onChange={handleChange}
          onBlur={() => handleBlur('oldPassword')}
          error={errors.oldPassword}
          required
        />
        <div>
          <Input
            label="New Password"
            type="password"
            name="newPassword"
            placeholder="••••••••"
            value={values.newPassword as string}
            onChange={handleChange}
            onBlur={() => handleBlur('newPassword')}
            error={errors.newPassword}
            required
          />
          {values.newPassword ? (
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${strength.bar}`} style={{ width: strength.width }} />
              </div>
              <p className={`mt-1 text-xs font-medium ${strength.text}`}>{strength.label} password</p>
            </div>
          ) : null}
        </div>
        <Input
          label="Confirm New Password"
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={values.confirmPassword as string}
          onChange={handleChange}
          onBlur={() => handleBlur('confirmPassword')}
          error={errors.confirmPassword}
          required
        />
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Update Password</Button>
        </div>
      </form>
    </div>
  );
}
