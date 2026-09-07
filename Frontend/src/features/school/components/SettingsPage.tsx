'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutAction } from '@/store/slices/authSlice';
import { Card, PageHeader } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { BranchProfileForm } from './parts/BranchProfileForm';
import { OrgBrandingForm } from './parts/OrgBrandingForm';
import BranchBrandingForm from './parts/BranchBrandingForm';
import ProfileSection from './parts/ProfileSection';
import PasswordSection from './parts/PasswordSection';
import PortalAccessSection from './parts/PortalAccessSection';
import SmtpSettingsSection from './parts/SmtpSettingsSection';
import StorageSettingsSection from './parts/StorageSettingsSection';
import BranchSwitcherSection from './parts/BranchSwitcherSection';

type TabKey = 'profile' | 'branch' | 'branches' | 'branding' | 'access' | 'secrets' | 'security';

const BASE_TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { key: 'branch', label: 'Branch Profile', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5' },
  { key: 'branches', label: 'My Branches', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { key: 'access', label: 'Portal Access', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
  { key: 'branding', label: 'Branding & Theme', icon: 'M7 21a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { key: 'secrets', label: 'Secrets', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { key: 'security', label: 'Change Password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
];

export default function SettingsPage() {
  const { school, organization } = useAppSelector((s) => s.auth);
  const user = useAppSelector((s) => s.auth.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdminLevel = isSuperAdmin || user?.role === 'ADMIN';
  const [tab, setTab] = useState<TabKey>('profile');
  const dispatch = useAppDispatch();
  const router = useRouter();
  const handleLogout = async () => {
    await dispatch(logoutAction());
    // Redirect to unified login with org slug on logout
    router.push(organization?.slug ? `/login?org=${organization.slug}` : '/login');
  };
  const tabs = BASE_TABS.filter(
    (t) =>
      (t.key !== 'branches' || (isAdminLevel && !!user?.schoolId)) &&
      (t.key !== 'branding' || isAdminLevel) &&
      (t.key !== 'secrets' || isAdminLevel)
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, branch, branding and security." />

      <Card className="overflow-hidden">
        {/* Tab Bar */}
        <div className="border-b border-gray-100 bg-gray-50/40 px-1 sm:px-3 pt-3">
          <div className="flex gap-0.5 overflow-x-auto pb-0 scrollbar-none">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative flex items-center gap-2 shrink-0 px-3 sm:px-4 py-2.5 text-[13px] font-medium rounded-t-xl transition-all duration-200',
                  tab === t.key
                    ? 'bg-white text-primary-700 shadow-sm border border-gray-100 border-b-transparent -mb-px z-10'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                )}
              >
                <svg className={cn('w-4 h-4 shrink-0', tab === t.key ? 'text-primary-500' : 'text-gray-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={t.icon} />
                </svg>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 lg:p-8">
          {tab === 'profile' && <ProfileSection />}
          {tab === 'branch' && <BranchProfileForm key={school?.id} />}
          {tab === 'branches' && isAdminLevel && <BranchSwitcherSection />}
          {tab === 'branding' && (
            <div className="space-y-8">
              {isAdminLevel && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Organization Branding</h3>
                  <OrgBrandingForm />
                </div>
              )}
              {isAdminLevel && (
                <div className="border-t border-gray-100 pt-8">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Branch Branding</h3>
                  <p className="text-xs text-gray-400 mb-4">The organization logo is shown by default until the branch has its own logo set.</p>
                  <BranchBrandingForm key={school?.id} />
                </div>
              )}
              {!isAdminLevel && <BranchBrandingForm key={school?.id} />}
            </div>
          )}
          {tab === 'access' && <PortalAccessSection />}
          {tab === 'secrets' && isAdminLevel && (
            <div className="max-w-2xl space-y-10">
              {/* Secrets = tenant credentials: outgoing email + media storage.
                  Single-branch organizations use org-level credentials; branch
                  admins can provide their own credentials via branch override
                  (Apply To). */}
              <SmtpSettingsSection />
              <div className="border-t border-gray-100" />
              <StorageSettingsSection />
            </div>
          )}
          {tab === 'security' && <PasswordSection />}
        </div>

        {/* Sign Out */}
        <div className="border-t border-gray-100 px-5 py-4 sm:px-6 lg:px-8">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </Card>
    </div>
  );
}
