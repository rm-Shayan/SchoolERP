'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { schoolService } from '@/lib/api';
import { useForm, composeValidators, minLength, required } from '@/lib/utils';
import { Button, Card, CardContent, Input } from '@/features/shared/components';
import toast from 'react-hot-toast';

/** Shared parent/student portal password — branch admin set/reset karta hai. */
export default function PortalAccessSection() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId ?? '';
  const [status, setStatus] = useState<{ hasCustomPassword: boolean; schoolCode: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!schoolId) return;
    setLoading(true);
    schoolService.getPortalPasswordStatus(schoolId)
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  };
  useEffect(load, [schoolId]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, reset } = useForm({
    initialValues: { password: '', confirm: '' },
    validators: {
      password: composeValidators(required('Password required'), minLength(6, 'At least 6 characters')),
      confirm: (v: unknown, all: Record<string, unknown>) =>
        v !== all.password ? 'Passwords do not match' : undefined,
    },
    onSubmit: async (v) => {
      try {
        await schoolService.setPortalPassword(schoolId, v.password as string);
        toast.success('Portal password updated — parents/students will now use the new one');
        reset();
        load();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to update portal password');
      }
    },
  });

  const resetToDefault = async () => {
    if (!confirm('Reset to default? Parents/students will sign in with the School Code as the password.')) return;
    try {
      await schoolService.resetPortalPassword(schoolId);
      toast.success('Reset to default (School Code)');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to reset');
    }
  };

  return (
    <Card>
      <CardContent className="p-5 sm:p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Parent &amp; Student Portal Password</h3>
          <p className="mt-1 text-sm text-gray-500">
            Parents and students log in with <b>School Code + Roll No/Phone</b> and this shared password.
          </p>
        </div>

        {loading ? (
          <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ) : (
          <div className={`rounded-xl border px-4 py-3 text-sm ${status?.hasCustomPassword
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            {status?.hasCustomPassword ? (
              <>A custom portal password is <b>active</b>. Use &ldquo;Set new password&rdquo; below to change it.</>
            ) : (
              <>Currently the <b>default</b> is active — parents/students type the School Code (<b>{status?.schoolCode ?? '—'}</b>) as the password.</>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
          <Input label="New Portal Password" name="password" type="password" placeholder="Min 6 characters"
            value={values.password as string} onChange={handleChange} onBlur={() => handleBlur('password')} error={errors.password} required />
          <Input label="Confirm Password" name="confirm" type="password" placeholder="Repeat password"
            value={values.confirm as string} onChange={handleChange} onBlur={() => handleBlur('confirm')} error={errors.confirm} required />
          <div className="sm:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" loading={isSubmitting}>Save Password</Button>
            <Button type="button" variant="outline" onClick={resetToDefault}>Reset to Default</Button>
          </div>
        </form>

        <p className="text-xs leading-relaxed text-gray-400 border-t border-gray-100 pt-4">
          Staff passwords are separate — reset any staff member&apos;s password from Staff Management → Edit → Reset Password,
          or they can use &ldquo;Forgot password?&rdquo; on the login page themselves.
        </p>
      </CardContent>
    </Card>
  );
}
