'use client';

import { Suspense, lazy, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutAction } from '@/store/slices/authSlice';
import { Card, PageHeader } from '@/features/shared/components';
import SettingsTabs, { type TabKey } from './parts/SettingsTabs';
import AvatarSection from './parts/AvatarSection';
import ProfileForm from './parts/ProfileForm';
import PasswordForm from './parts/PasswordForm';
import AccountDetails from './parts/AccountDetails';
import PlatformStatus from './parts/PlatformStatus';

const BranchSettingsTab = lazy(() => import('./BranchSettingsTabContent'));

function TabSpinner() {
  return (
    <div className="p-12 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [tab, setTab] = useState<TabKey>('profile');
  const handleTabChange = useCallback((next: TabKey) => setTab(next), []);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await dispatch(logoutAction());
    router.push('/admin/login');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, profile picture, and account security."
      />

      <Card className="overflow-hidden">
        <SettingsTabs active={tab} onChange={handleTabChange} />

        {tab === 'profile' ? (
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 min-w-0">
            <AvatarSection user={user} />
            <ProfileForm user={user} />
          </div>
        ) : tab === 'platform' ? (
          <div className="p-6 sm:p-8 min-w-0">
            <PlatformStatus />
          </div>
        ) : tab === 'branches' ? (
          <Suspense fallback={<TabSpinner />}>
            <BranchSettingsTab />
          </Suspense>
        ) : (
          <div className="p-6 sm:p-8 max-w-2xl min-w-0">
            <PasswordForm />
          </div>
        )}

        <div className="border-t border-gray-100 px-6 py-4">
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

      <AccountDetails user={user} />
    </div>
  );
}
