'use client';

import { useCallback, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Card, PageHeader } from '@/features/shared/components';
import SettingsTabs, { type TabKey } from './parts/SettingsTabs';
import AvatarSection from './parts/AvatarSection';
import ProfileForm from './parts/ProfileForm';
import PasswordForm from './parts/PasswordForm';
import AccountDetails from './parts/AccountDetails';
import PlatformStatus from './parts/PlatformStatus';

export default function SettingsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [tab, setTab] = useState<TabKey>('profile');
  const handleTabChange = useCallback((next: TabKey) => setTab(next), []);

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
        ) : (
          <div className="p-6 sm:p-8 max-w-2xl min-w-0">
            <PasswordForm />
          </div>
        )}
      </Card>

      <AccountDetails user={user} />
    </div>
  );
}
