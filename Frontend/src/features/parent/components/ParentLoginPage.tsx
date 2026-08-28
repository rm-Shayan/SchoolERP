'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/features/shared/components';
import OrgBrandingHeader from '@/features/shared/components/OrgBrandingHeader';
import { useOrgBranding } from '@/hooks/useOrgBranding';
import ParentLoginForms from './ParentLoginForms';
import StudentLoginForm from './StudentLoginForm';
import { cn } from '@/lib/utils';

interface ParentLoginPageProps {
  code?: string;
  orgSlug?: string;
}

const BrandIcon = () => (
  <img src="/screen.png" alt="SchoolERP" className="h-full w-full object-contain" />
);

export default function ParentLoginPage({ code, orgSlug }: ParentLoginPageProps) {
  const { branding } = useOrgBranding({ code, slug: orgSlug });
  const [tab, setTab] = useState<'parent' | 'student'>('parent');

  // Dynamic routing: slug contains "student" → auto-select student tab
  useEffect(() => {
    if (orgSlug?.toLowerCase().includes('student')) setTab('student');
  }, [orgSlug]);

  const theme = branding?.themeColor;

  return (
    <AuthLayout
      variant="secondary"
      themeColor={theme || undefined}
      brandIcon={<BrandIcon />}
      brandLabel="SchoolERP"
      brandSub="Student & Parent Portal"
      badge="School Code · Phone · Password"
      heading="Stay close to your child's school day."
      description="Track attendance, fee status, homework, and school notices — sign in with your school code + school password."
      features={['Fee & attendance updates', 'Homework & notices', 'Same school password everywhere', 'No OTP required']}
      footerNote={
        <p className="text-slate-500">
          Staff member?{' '}
          <Link href="/login" className="font-semibold transition hover:opacity-80" style={theme ? { color: theme } : undefined}>
            Use the school login
          </Link>
        </p>
      }
    >
      {branding && (
        <OrgBrandingHeader name={branding.name} orgName={branding.orgName} logoUrl={branding.logoUrl} themeColor={theme || '#2563eb'} />
      )}

      {/* Themed tab switcher */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
        {(['parent', 'student'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn('rounded-lg px-3 py-2.5 text-sm font-semibold transition-all', tab === t ? 'shadow-sm' : 'text-gray-500 hover:text-gray-700')}
            style={tab === t ? { background: theme || '#ffffff', color: theme ? '#ffffff' : '#111827' } : undefined}
          >
            {t === 'parent' ? 'Parent (Phone)' : 'Student (Roll No)'}
          </button>
        ))}
      </div>

      {tab === 'parent' ? <ParentLoginForms themeColor={theme} /> : <StudentLoginForm themeColor={theme} />}
    </AuthLayout>
  );
}
