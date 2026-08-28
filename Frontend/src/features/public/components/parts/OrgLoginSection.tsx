'use client';

import { useState } from 'react';
import LoginCard from '@/features/auth/components/LoginCard';
import ParentLoginForms from '@/features/parent/components/ParentLoginForms';
import StudentLoginForm from '@/features/parent/components/StudentLoginForm';
import Logo from '@/features/shared/components/Logo';
import type { OrgPublicData } from '@/lib/api/orgService';
import type { SchoolBranding } from '@/types';
import { cn } from '@/lib/utils';

type LoginRole = 'staff' | 'student' | 'parent';

const TABS: { key: LoginRole; label: string; note: string; icon: string }[] = [
  {
    key: 'staff',
    label: 'Admin / Staff',
    note: 'School code + email or username',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    key: 'student',
    label: 'Student',
    note: 'School code + roll number + school password',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    key: 'parent',
    label: 'Parent',
    note: 'School code + phone + school password',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
];

interface OrgLoginSectionProps {
  org: OrgPublicData;
  theme: string;
}

export default function OrgLoginSection({ org, theme }: OrgLoginSectionProps) {
  const [role, setRole] = useState<LoginRole>('staff');

  const branding: SchoolBranding = {
    code: org.branches.length === 1 ? org.branches[0].code : '',
    name: org.name,
    orgName: org.name,
    logoUrl: org.logoUrl,
    themeColor: org.themeColor,
  };

  return (
    <section id="login" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center mb-4">
            <Logo src={org.logoUrl} name={org.name} size="lg" />
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ borderColor: `${theme}30`, backgroundColor: `${theme}08`, color: theme }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme }} />
            Portal Login
          </span>
          <h2 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
            Sign in to your portal
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Staff, students and parents — choose your role below and sign in securely.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Role selector */}
          <div className="flex flex-col gap-3">
            {TABS.map((tab) => {
              const active = role === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRole(tab.key)}
                  className={cn(
                    'flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-300',
                    active
                      ? 'border-transparent text-white shadow-xl'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-lg'
                  )}
                  style={active ? { backgroundColor: theme, boxShadow: `0 8px 32px ${theme}30` } : undefined}
                >
                  <span
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition',
                      active ? 'bg-white/20' : 'bg-gray-100'
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold">{tab.label}</span>
                    <span className={cn('block text-sm', active ? 'text-white/75' : 'text-gray-500')}>
                      {tab.note}
                    </span>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Active form */}
          <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-2xl shadow-gray-900/5 sm:p-8">
            {role === 'staff' && (
              <LoginCard
                branding={branding}
                heading="Staff Sign In"
                subheading="Use your school code with the email or username given to you."
              />
            )}
            {role === 'student' && <StudentLoginForm themeColor={theme} />}
            {role === 'parent' && <ParentLoginForms themeColor={theme} />}
          </div>
        </div>
      </div>
    </section>
  );
}
