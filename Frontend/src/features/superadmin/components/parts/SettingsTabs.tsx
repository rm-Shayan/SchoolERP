'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

export type TabKey = 'profile' | 'security' | 'platform';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: 'security',
    label: 'Change Password',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    key: 'platform',
    label: 'Platform',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

interface SettingsTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

function SettingsTabs({ active, onChange }: SettingsTabsProps) {
  return (
    <div className="border-b border-gray-100/80 bg-gradient-to-r from-gray-50/60 to-gray-50/30 px-4 pt-3">
      <div role="tablist" className="flex gap-1.5 overflow-x-auto sm:overflow-visible pb-px">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-xl transition-all duration-200',
              active === t.key
                ? 'bg-white text-primary-700 shadow-sm shadow-primary-100/50 border-b-2 border-primary-600 -mb-px'
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/60 border-b-2 border-transparent'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(SettingsTabs);
