'use client';

import { useState } from 'react';
import Link from 'next/link';
import { composeValidators, isEmail, required, useForm } from '@/lib/utils';
import { authService } from '@/lib/api';
import { AuthLayout, Button, Input } from '@/features/shared/components';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { email: '' },
    validators: {
      email: composeValidators(required('Email is required'), isEmail()),
    },
    onSubmit: async (v) => {
      await authService.forgotPassword((v.email as string).trim().toLowerCase());
      setSent(true);
    },
  });

  return (
    <AuthLayout
      variant="secondary"
      brandIcon={<img src="/screen.png" alt="SchoolERP" className="h-full w-full object-contain" />}
      brandLabel="School Management System"
      brandSub="SchoolERP"
      badge="Account Recovery"
      heading="Locked out? We'll get you back in."
      description="Enter the email linked to your staff account and we'll send you a fresh password right away."
      features={['Instant email delivery', 'Works for all staff roles', 'Secure temporary password', 'Change it anytime later']}
      footerNote={
        <p className="text-slate-500">
          Remembered it?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            If an account exists for <b>{values.email as string}</b>, a new password is on its way. Check your inbox
            (and spam folder just in case).
          </div>
          <Link href="/login">
            <Button className="w-full">Back to sign in</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="mb-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Forgot your password?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              We&apos;ll email a temporary password to your registered staff email.
            </p>
          </div>
          <Input
            label="Staff Email"
            type="email"
            name="email"
            placeholder="you@yourschool.edu"
            value={values.email as string}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            required
          />
          <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-1">
            Send new password
          </Button>
          <p className="text-xs leading-relaxed text-slate-400">
            Parents &amp; students don&apos;t need this page — sign in from the portal with the school&apos;s shared
            password, or contact your school office.
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
