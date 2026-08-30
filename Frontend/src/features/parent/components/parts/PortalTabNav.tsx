'use client';

import { cn } from '@/lib/utils';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';

export type PortalTab = 'overview' | 'attendance' | 'fees' | 'homework' | 'notices' | 'results' | 'exams' | 'timetable' | 'conduct' | 'ptm' | 'leave' | 'notifications' | 'profile';

interface TabNavProps {
  active: PortalTab;
  onChange: (tab: PortalTab) => void;
  unreadCount?: number;
}

const TABS: { key: PortalTab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { key: 'attendance', label: 'Attendance', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'fees', label: 'Fees', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'homework', label: 'Homework', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { key: 'notices', label: 'Notices', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { key: 'results', label: 'Results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { key: 'timetable', label: 'Timetable', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'exams', label: 'Exams', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { key: 'conduct', label: 'Conduct', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'ptm', label: 'PTM', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'leave', label: 'Leave', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { key: 'notifications', label: 'Alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { key: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function PortalTabNav({ active, onChange, unreadCount }: TabNavProps) {
  const theme = getOrgThemeColor();

  return (
    <>
      {/* Desktop horizontal tabs */}
      <div className="hidden md:flex gap-0 border-b border-gray-200 bg-white px-4 overflow-x-auto">
        {TABS.map((t) => {
          const isActive = active === t.key;
          const isAlerts = t.key === 'notifications';
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className="relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
              style={isActive ? { borderColor: theme || '#2563eb', color: theme || '#2563eb' } : { borderColor: 'transparent', color: '#6b7280' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              {t.label}
              {isAlerts && unreadCount && unreadCount > 0 ? (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white leading-none" style={{ background: theme || '#ef4444' }}>{unreadCount}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around">
          {TABS.map((t) => {
            const isActive = active === t.key;
            const isAlerts = t.key === 'notifications';
            return (
              <button
                key={t.key}
                onClick={() => onChange(t.key)}
                className="flex flex-col items-center gap-0.5 py-2 px-1 min-w-0 flex-1 text-[10px] font-medium transition-colors relative"
                style={isActive ? { color: theme || '#2563eb' } : { color: '#9ca3af' }}
              >
                <div className="relative">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                  </svg>
                  {isAlerts && unreadCount && unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-2 text-[8px] font-bold px-1 py-0 rounded-full text-white leading-none" style={{ background: theme || '#ef4444' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  ) : null}
                </div>
                <span className="truncate">{t.label}</span>
                {isActive ? (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: theme || '#2563eb' }} />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
