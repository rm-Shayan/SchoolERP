'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AuthLayout from '@/features/shared/components/AuthLayout';
import LoginGroupTabs, { type LoginGroup } from '@/features/auth/components/parts/LoginGroupTabs';
import { ROLES } from '@/features/auth/components/parts/roles';
import BrandVisual from './parts/BrandVisual';
import StaffLoginSection from './parts/StaffLoginSection';
import ParentLoginForms from '@/features/parent/components/ParentLoginForms';
import StudentLoginForm from '@/features/parent/components/StudentLoginForm';
import AdminLoginForm from '@/features/auth/components/parts/AdminLoginForm';
import { useOrgBranding } from '@/hooks/useOrgBranding';
import type { SchoolBranding } from '@/types';

interface LoginHubPageProps {
  orgSlug?: string;
  code?: string;
  initialBranding?: SchoolBranding | null;
}

export default function LoginHubPage({ orgSlug, code, initialBranding }: LoginHubPageProps) {
  const { branding, setBranding } = useOrgBranding({ code, slug: orgSlug, initialBranding });
  const [group, setGroup] = useState<LoginGroup>('staff');

  const themeColor = branding?.themeColor || undefined;
  const role = ROLES.find((r) => r.key === group) ?? ROLES[0];

  return (
    <AuthLayout
      themeColor={themeColor}
      brandIcon={
        branding ? (
          <BrandVisual name={branding.name} logoUrl={branding.logoUrl} />
        ) : (
          <img src="/screen.png" alt="SchoolERP" className="h-full w-full object-contain" />
        )
      }
      brandLabel={branding?.orgName ?? 'School Management System'}
      brandSub={branding?.name ?? 'SchoolERP'}
      badge={role.panel.badge}
      heading={role.panel.heading}
      description={role.panel.description}
      features={role.panel.features}
      footerNote={
        <div className="space-y-2">
          {orgSlug && (
            <Link
              href={`/o/${encodeURIComponent(orgSlug)}`}
              className="block text-sm font-semibold transition hover:opacity-80"
              style={themeColor ? { color: themeColor } : undefined}
            >
              ← Back to school page
            </Link>
          )}
          <p className="text-sm text-slate-500">Having trouble signing in? Contact your school office.</p>
        </div>
      }
    >
      <LoginGroupTabs active={group} themeColor={themeColor} onChange={setGroup} />

      <motion.div
        key={group}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {group === 'staff' && (
          <StaffLoginSection branding={branding} onBrandingChange={setBranding} />
        )}
        {group === 'parent' && <ParentLoginForms themeColor={themeColor} />}
        {group === 'student' && <StudentLoginForm themeColor={themeColor} />}
        {group === 'admin' && <AdminLoginForm themeColor={themeColor} />}
      </motion.div>
    </AuthLayout>
  );
}
