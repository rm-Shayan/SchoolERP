'use client';

import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  count: number;
  themeColor?: string;
  onToggle: () => void;
}

export default function NotificationBellButton({ open, count, themeColor, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative p-2 rounded-full transition-colors duration-150',
        open
          ? 'bg-black/[0.08] text-gray-900'
          : 'text-gray-500 hover:bg-black/[0.06] hover:text-gray-700',
      )}
      aria-label="Notifications"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
          style={{ backgroundColor: themeColor }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
