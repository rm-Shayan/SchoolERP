'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type LoginGroup = 'staff' | 'parent' | 'student' | 'admin';

const BuildingIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ChatIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8m-8 4h4m-5.5 7L3 18.5A3.5 3.5 0 013 14.5V7a4 4 0 014-4h10a4 4 0 014 4v7a4 4 0 01-4 4H8l-3.5 3z" />
  </svg>
);

const CapIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-9-1l9 5 9-5m0-7v6" />
  </svg>
);

const KeyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const GROUPS: { key: LoginGroup; label: string; icon: ReactNode }[] = [
  { key: 'staff', label: 'Staff', icon: <BuildingIcon /> },
  { key: 'parent', label: 'Parent', icon: <ChatIcon /> },
  { key: 'student', label: 'Student', icon: <CapIcon /> },
  { key: 'admin', label: 'Admin', icon: <KeyIcon /> },
];

interface LoginGroupTabsProps {
  active: LoginGroup;
  themeColor?: string;
  onChange: (key: LoginGroup) => void;
}

export default function LoginGroupTabs({ active, themeColor, onChange }: LoginGroupTabsProps) {
  return (
    <div className="mb-6 grid grid-cols-4 gap-1 rounded-xl bg-gray-100/80 p-1">
      {GROUPS.map((g) => {
        const isActive = active === g.key;
        return (
          <button
            key={g.key}
            type="button"
            onClick={() => onChange(g.key)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg px-1 py-2.5 text-xs sm:text-[13px] font-semibold transition-all duration-200 min-w-0',
              isActive ? 'text-white shadow-md' : 'text-gray-500 hover:bg-white/70 hover:text-gray-800',
            )}
            style={isActive
              ? { backgroundColor: themeColor || '#6366f1', boxShadow: `0 4px 14px ${themeColor || '#6366f1'}35` }
              : undefined}
          >
            <span className={cn('shrink-0 [&_svg]:h-4 [&_svg]:w-4', isActive ? 'text-white' : 'text-current')}>
              {g.icon}
            </span>
            <span className="truncate">{g.label}</span>
          </button>
        );
      })}
    </div>
  );
}
