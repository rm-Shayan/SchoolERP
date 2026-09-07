'use client';

import { useEffect, useState } from 'react';
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
import { applyOrgThemeToRoot, clearOrgThemeFromRoot } from '@/lib/theme';
import type { SchoolBranding } from '@/types';

interface LoginHubPageProps {
  orgSlug?: string;
  code?: string;
  initialBranding?: SchoolBranding | null;
}

export default function LoginHubPage({ orgSlug, code, initialBranding }: LoginHubPageProps) {
  const { branding, setBranding } = useOrgBranding({ code, slug: orgSlug, initialBranding });
  const [group, setGroup] = useState<LoginGroup>('staff');

  // Displayed org name comes from the resolved branding (never raw query params).
  const label = branding?.orgName || branding?.name || 'School Management System';
  // brandSub is the RESOLVED school/branch name — only present when a valid
  // school was found within the org. Stays empty for org-only or invalid school.
  const brandSubValue = branding?.school?.name ?? '';
  // Logo priority: school logo → organization logo → default. The backend
  // already collapses school→org into logoUrl, so we use branding.logoUrl.
  const themeColor = branding?.themeColor || undefined;

  // Apply the theme from the database (query param org/school/code → branding)
  // to the entire hub UI — root CSS vars override so every primary-* element
  // (buttons, links, focus rings, chips, background blobs) uses the org color,
  // not just the left panel/tabs. If no branding, clear to default violet.
  useEffect(() => {
    if (themeColor) applyOrgThemeToRoot(themeColor);
    else clearOrgThemeFromRoot();
    return () => { if (themeColor) clearOrgThemeFromRoot(); };
  }, [themeColor]);

  const role = ROLES.find((r) => r.key === group) ?? ROLES[0];
  const resolvedSlug = branding?.slug || orgSlug;

  return (
    <AuthLayout
      themeColor={themeColor}
      brandIcon={
        branding?.logoUrl ? (
          <BrandVisual name={branding.name} logoUrl={branding.logoUrl} />
        ) : (
          <img src="/screen.png" alt="SchoolERP" className="h-full w-full object-contain" />
        )
      }
      brandLabel={label}
      brandSub={brandSubValue}
      badge={role.panel.badge}
      heading={role.panel.heading}
      description={role.panel.description}
      features={role.panel.features}
      footerNote={
        <div className="space-y-2">
          {resolvedSlug && (
            <Link
              href={`/o/${encodeURIComponent(resolvedSlug)}`}
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
          <StaffLoginSection branding={branding} onBrandingChange={setBranding} branch={branding?.code} />
        )}
        {group === 'parent' && <ParentLoginForms themeColor={themeColor} />}
        {group === 'student' && <StudentLoginForm themeColor={themeColor} />}
        {group === 'admin' && <AdminLoginForm themeColor={themeColor} branding={branding} />}
      </motion.div>
    </AuthLayout>
  );
}