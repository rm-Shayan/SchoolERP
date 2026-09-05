'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { portalService } from '@/lib/api';
import { schoolService } from '@/lib/api';
import { Button, Input } from '@/features/shared/components';
import { composeValidators, required, minLength, useForm } from '@/lib/utils';
import AuthFormHeader from '@/features/auth/components/parts/AuthFormHeader';

interface StudentLoginFormProps {
  themeColor?: string;
}

export default function StudentLoginForm({ themeColor }: StudentLoginFormProps) {
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const slugTimer = useRef<number | undefined>(undefined);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { schoolCode: '', rollNumber: '', password: '' },
    validators: {
      schoolCode: required('School code is required'),
      rollNumber: composeValidators(required('Roll number is required'), minLength(1)),
      password: required('School password is required'),
    },
    onSubmit: async (v) => {
      setLocalError(null);
      try {
        const { token, student } = await portalService.studentLogin(
          (v.schoolCode as string).trim(),
          (v.rollNumber as string).trim(),
          v.password as string
        );
        localStorage.setItem('studentToken', token);
        localStorage.setItem('studentProfile', JSON.stringify(student));
        router.push('/student/dashboard');
      } catch (err: any) {
        setLocalError(err?.response?.data?.message ?? 'Invalid school code or roll number');
      }
    },
  });

  useEffect(() => () => window.clearTimeout(slugTimer.current), []);

  const onCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    const code = e.target.value.trim();
    window.clearTimeout(slugTimer.current);
    if (code.length < 2) {
      setSlug(null);
      return;
    }
    slugTimer.current = window.setTimeout(async () => {
      try {
        const b = await schoolService.getBranding({ code });
        setSlug(b.slug ?? null);
      } catch {
        setSlug(null);
      }
    }, 400);
  };

  return (
    <>
      <AuthFormHeader
        title="Student Portal"
        subtitle="Use the roll number issued by your school office."
      />

      {localError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {localError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="School Code"
          placeholder="e.g. GULSHAN-01"
          name="schoolCode"
          value={values.schoolCode as string}
          onChange={onCodeChange}
          onBlur={() => handleBlur('schoolCode')}
          error={errors.schoolCode}
          required
        />
        {slug && (
          <div className="-mt-3 mb-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-400">School slug:</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">{slug}</span>
          </div>
        )}
        <Input
          label="Roll Number"
          placeholder="e.g. 104"
          name="rollNumber"
          value={values.rollNumber as string}
          onChange={handleChange}
          onBlur={() => handleBlur('rollNumber')}
          error={errors.rollNumber}
          required
        />
        <Input
          label="School Password"
          type="password"
          placeholder="••••••••"
          name="password"
          value={values.password as string}
          onChange={handleChange}
          onBlur={() => handleBlur('password')}
          error={errors.password}
          autoComplete="current-password"
          required
        />
        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full"
          size="lg"
          themeColor={themeColor}
        >
          Sign in
        </Button>
      </form>
    </>
  );
}
