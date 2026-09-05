'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutAction } from '@/store/slices/authSlice';
import { Card, PageHeader } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import ProfileTab from './parts/TeacherProfileTab';
import PasswordTab from './parts/TeacherPasswordTab';

type TabKey = 'profile' | 'security';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { key: 'security', label: 'Change Password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('profile');
  const dispatch = useAppDispatch();
  const router = useRouter();
  const organization = useAppSelector((s) => s.auth.organization);

  const handleLogout = async () => {
    await dispatch(logoutAction());
    // Whole app: logout par org slug ke saath unified login par le jao
    router.push(organization?.slug ? `/login?org=${organization.slug}` : '/login');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and security." />

      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/40 px-3 pt-3">
          <div className="flex gap-0.5 overflow-x-auto pb-0">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative flex items-center gap-2 shrink-0 px-4 py-2.5 text-[13px] font-medium rounded-t-xl transition-all duration-200',
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

        <div className="p-5 sm:p-6 lg:p-8">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'security' && <PasswordTab />}
        </div>

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
