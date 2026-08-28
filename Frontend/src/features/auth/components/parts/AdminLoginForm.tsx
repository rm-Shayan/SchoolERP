'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { composeValidators, getRoleHomePath, isEmail, isPassword, required, useForm } from '@/lib/utils';
import { Button, Input } from '@/features/shared/components';
import AuthFormHeader from './AuthFormHeader';

interface AdminLoginFormProps {
  themeColor?: string;
}

export default function AdminLoginForm({ themeColor }: AdminLoginFormProps) {
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
        // dashboard. Previously a non-super-admin was dead-ended with an error;
        // now they land on the correct portal automatically.
        router.push(
          getRoleHomePath(result.payload.user.role, result.payload.user.organizationId, result.payload.organization?.slug)
        );
      }
    },
  });

  return (
    <div>
      <AuthFormHeader
        title="Platform Admin"
        subtitle="Organization admins sign in with email and password."
      />

      {(error || localError) && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {localError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <Button
          type="submit"
          loading={loading || isSubmitting}
          className="w-full"
          size="lg"
          themeColor={themeColor}
        >
          Sign in
        </Button>

        <p className="text-center">
          <Link href="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            Forgot password?
          </Link>
        </p>
      </form>
    </div>
  );
}
