'use client';

import { cn } from '@/lib/utils';
import type { PortalNotification } from '@/lib/api/notificationService';

const CAT_ICON: Record<string, string> = {
  PTM: '📅', HOMEWORK: '📝', EXAM: '📋', STAFF: '👤', STUDENT: '🎓', FEE: '💰', CIRCULAR: '📢', GENERAL: '🔔',
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
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({ n, onRead, onDelete }: Props) {
  return (
    <div
      onClick={() => !n.isRead && onRead(n.id)}
      className={cn(
        'group cursor-pointer px-4 py-3 border-b border-gray-50 hover:bg-gray-50/60 transition-colors',
        !n.isRead && 'bg-blue-50/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-base mt-0.5 shrink-0">{CAT_ICON[n.category] || '🔔'}</span>
          <div className="min-w-0">
            <p className={cn('text-sm truncate', n.isRead ? 'text-gray-700' : 'font-semibold text-gray-900')}>{n.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
