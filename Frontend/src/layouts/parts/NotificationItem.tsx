'use client';

import { cn } from '@/lib/utils';
import type { PortalNotification } from '@/lib/api/notificationService';

const CAT_ICON: Record<string, string> = {
  PTM: '📅', HOMEWORK: '📝', EXAM: '📋', STAFF: '👤', STUDENT: '🎓', FEE: '💰',
  CIRCULAR: '📢', GENERAL: '🔔', ADMISSION: '🎓', LEAVE: '🏖️', ATTENDANCE: '✅', CONDUCT: '⭐',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface Props {
  n: PortalNotification;
  themeColor?: string | null;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * LinkedIn-style notification item:
 * - Unread: very subtle tinted background, bold title
 * - Read: white background, regular text
 * - Hover: light gray overlay (neutral, not themed)
 * - Click on unread: marks as read, bg returns to white
 */
export default function NotificationItem({ n, onRead, onDelete }: Props) {
  return (
    <div
      onClick={() => !n.isRead && onRead(n.id)}
      className={cn(
        'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-100',
        // LinkedIn: unread gets very subtle tint, hover is neutral gray
        !n.isRead ? 'bg-sky-50/60 hover:bg-sky-100/70' : 'hover:bg-gray-100/80',
        'border-b border-gray-100 last:border-b-0',
      )}
    >
      {/* Category icon */}
      <span className="text-lg mt-0.5 shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
        {CAT_ICON[n.category] || '🔔'}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-[13px] leading-snug', !n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
        <span className="text-[11px] text-gray-400 mt-1 block">{timeAgo(n.createdAt)}</span>
      </div>

      {/* Unread dot */}
      <div className="shrink-0 mt-2">
        {!n.isRead && (
          <span className="block w-2 h-2 rounded-full bg-primary-500" />
        )}
      </div>
    </div>
  );
}
