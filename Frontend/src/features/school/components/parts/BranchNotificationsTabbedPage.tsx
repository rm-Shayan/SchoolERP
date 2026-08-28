'use client';

import { Suspense, useState } from 'react';
import PageLoader from '@/components/PageLoader';
import NotificationLogsPage from '@/features/school/components/NotificationLogsPage';
import PortalNotificationsPage from '@/features/school/components/PortalNotificationsPage';

const TABS = [
  { key: 'portal', label: 'Notifications' },
  { key: 'logs', label: 'Email Logs' },
] as const;

export default function BranchNotificationsTabbedPage() {
  const [tab, setTab] = useState<'portal' | 'logs'>('portal');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Suspense fallback={<PageLoader />}>
        {tab === 'portal' ? <PortalNotificationsPage /> : <NotificationLogsPage />}
      </Suspense>
    </div>
  );
}
