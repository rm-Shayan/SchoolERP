'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { getRoleHomePath, required, useForm } from '@/lib/utils';
import { Button, Input } from '@/features/shared/components';
import { schoolService } from '@/lib/api';
import type { SchoolBranding } from '@/types';
import { BuildingIcon, EyeIcon, LockIcon, UserIcon } from './parts/loginIcons';
import AuthFormHeader from './parts/AuthFormHeader';
import ForgotPasswordLink from './parts/ForgotPasswordLink';

interface LoginCardProps {
  branding?: SchoolBranding | null;
  onBrandingChange?: (branding: SchoolBranding | null) => void;
  heading?: string;
  subheading?: string;
  /** Header parent component khud render kare (LoginHub hub-style headers). */
  hideHeading?: boolean;
  school?: string;
  branch?: string;
}

export default function LoginCard({ branding, onBrandingChange, heading, subheading, hideHeading, school, branch }: LoginCardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [schoolCode, setSchoolCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const codeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Priority: branch > school > branding.code
    if (branch && !schoolCode.trim()) setSchoolCode(branch);
    if (school && !schoolCode.trim()) setSchoolCode(school);
    if (branding?.code && !schoolCode.trim()) setSchoolCode(branding.code);
  }, [branding, school, branch, schoolCode]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { identifier: '', password: '' },
    validators: {
      identifier: required('Email or username is required'),
      password: required('Password is required'),
    },
    onSubmit: async (v) => {
      const trimmed = (v.identifier as string).trim();
      const payload = {
        password: v.password as string,
        ...(schoolCode.trim() ? { schoolCode: schoolCode.trim() } : {}),
        ...(trimmed.includes('@') ? { email: trimmed } : { username: trimmed }),
      };
      const result = await dispatch(login(payload));
      if (login.fulfilled.match(result)) {
        router.push(
          getRoleHomePath(result.payload.user.role, result.payload.user.organizationId, result.payload.organization?.slug)
        );
      }
    },
  });

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSchoolCode(value);
    window.clearTimeout(codeTimer.current);
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    codeTimer.current = window.setTimeout(() => {
      schoolService.getBranding({ code: trimmed }).then(onBrandingChange).catch(() => undefined);
    }, 400);
  };

  return (
    <div>
      {!hideHeading && (
        <AuthFormHeader
          title={heading ?? 'Staff Portal'}
          subtitle={subheading ?? 'Enter your credentials to access the dashboard.'}
        />
      )}

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="School Code"
          placeholder="e.g. GULSHAN-01"
          value={schoolCode}
          onChange={handleCodeChange}
          icon={<BuildingIcon />}
          autoComplete="organization"
        />
        <Input
          label="Email or Username"
          placeholder="you@example.com or username"
          name="identifier"
          value={values.identifier as string}
          onChange={handleChange}
          onBlur={() => handleBlur('identifier')}
          error={errors.identifier}
          icon={<UserIcon />}
          autoComplete="username"
          required
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          name="password"
          value={values.password as string}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
          error={errors.password}
          icon={<LockIcon />}
          autoComplete="current-password"
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <EyeIcon open={showPassword} />
            </button>
          }
          required
        />

        <Button
          type="submit"
          loading={loading || isSubmitting}
          className="w-full"
          size="lg"
          themeColor={branding?.themeColor}
        >
          Sign in
        </Button>
      </form>

      <div className="mt-4">
        <ForgotPasswordLink branding={branding} schoolCode={schoolCode.trim() || undefined} />
      </div>
    </div>
  );
}
