'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { composeValidators, isEmail, required, useForm } from '@/lib/utils';
import { authService } from '@/lib/api';
import { AuthLayout, Button, Input } from '@/features/shared/components';
import { applyOrgThemeToRoot, clearOrgThemeFromRoot } from '@/lib/theme';
import type { SchoolBranding } from '@/types';

interface ForgotPasswordPageProps {
  branding?: SchoolBranding | null;
}

export default function ForgotPasswordPage({ branding }: ForgotPasswordPageProps) {
  const [sent, setSent] = useState(false);
  const themeColor = branding?.themeColor || undefined;

  // Login hub ki tarah org theme yahan bhi apply karo — forgot-password page
  // bhi branded rehto hai jab org/school query param se aaya ho.
  useEffect(() => {
    if (themeColor) applyOrgThemeToRoot(themeColor);
    else clearOrgThemeFromRoot();
    return () => { if (themeColor) clearOrgThemeFromRoot(); };
  }, [themeColor]);

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

  const label = branding?.orgName || branding?.name || 'School Management System';
  const schoolName = branding?.school?.name || 'SchoolERP';
  const backHref = branding?.slug ? `/login?org=${encodeURIComponent(branding.slug)}` : '/login';

  return (
    <AuthLayout
      variant="secondary"
      themeColor={themeColor}
      brandIcon={
        branding?.logoUrl ? (
          <img src={branding.logoUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <img src="/screen.png" alt="SchoolERP" className="h-full w-full object-contain" />
        )
      }
      brandLabel={label}
      brandSub={schoolName}
      badge="Account Recovery"
      heading="Locked out? We'll get you back in."
      description="Enter the email linked to your staff account and we'll send you a fresh password right away."
      features={['Instant email delivery', 'Works for all staff roles', 'Secure temporary password', 'Change it anytime later']}
      footerNote={
        <p className="text-slate-500">
          Remembered it?{' '}
          <Link href={backHref} className="font-semibold text-primary-600 hover:text-primary-700">
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
          <Link href={backHref}>
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
          <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-1" themeColor={themeColor}>
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