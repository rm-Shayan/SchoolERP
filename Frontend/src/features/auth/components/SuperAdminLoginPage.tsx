'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { composeValidators, getRoleHomePath, isEmail, isPassword, required, useForm } from '@/lib/utils';
import { AuthLayout, Button, Input } from '@/features/shared/components';

export default function SuperAdminLoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [localError, setLocalError] = useState<string | null>(null);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { email: '', password: '' },
    validators: {
      email: composeValidators(required('Email is required'), isEmail()),
      password: composeValidators(required(), isPassword()),
    },
    onSubmit: async (v) => {
      setLocalError(null);
      const result = await dispatch(login({ email: (v.email as string).trim(), password: v.password as string }));
      if (login.fulfilled.match(result)) {
        // Route to the user's own portal based on role — SUPER_ADMIN → admin
        // console, ADMIN/RECEPTIONIST → branch dashboard, TEACHER → teacher
        // dashboard. Non-super-admins are sent to their portal instead of being
        // dead-ended with an error.
        router.push(
          getRoleHomePath(result.payload.user.role, result.payload.user.organizationId, result.payload.organization?.slug)
        );
      }
    },
  });

  return (
    <div className="superadmin-theme">
      <AuthLayout
        variant="superadmin"
        brandIcon={
          <img src="/screen.png" alt="SchoolERP" className="h-full w-full object-contain bg-transparent" />
        }
        brandLabel="School Management System"
        brandSub="Admin Console"
        badge="Multi-tenant command center"
        heading="Control every school from one place."
        description="Manage school onboarding, organization access, operations, reports, and platform growth across your entire network."
        features={['Organizations', 'School setup', 'System analytics', 'Secure access']}
        footerNote={
          <p className="text-slate-500">
            School staff?{' '}
            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Use the school login
            </Link>
          </p>
        }
      >
        <div className="mb-7">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Sign in to the admin console with your email and password.
          </p>
        </div>

        {(error || localError) && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="admin@yourplatform.com"
            name="email"
            value={values.email as string}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            name="password"
            value={values.password as string}
            onChange={handleChange}
            onBlur={() => handleBlur('password')}
            error={errors.password}
            required
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-1">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading || isSubmitting} className="w-full mt-3" size="lg">
            Sign in
          </Button>
        </form>
      </AuthLayout>
    </div>
  );
}
