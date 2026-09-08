'use client';

import type { PortalNotification } from '@/lib/api/notificationService';
import { cn } from '@/lib/utils';

const CAT_ICON: Record<string, string> = {
  PTM: '📅', HOMEWORK: '📝', EXAM: '📋', STAFF: '👤', STUDENT: '🎓', FEE: '💰', CIRCULAR: '📢', GENERAL: '🔔',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  n: PortalNotification;
  themeColor: string;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SuperAdminNotificationItem({ n, themeColor, onRead, onDelete }: Props) {
  const isUnread = !n.isRead;
  return (
    <div
      onClick={() => isUnread && onRead(n.id)}
      className="group flex cursor-pointer items-start gap-3 px-5 py-3.5 transition-colors hover:brightness-95"
      style={isUnread ? { backgroundColor: themeColor, color: '#fff' } : undefined}
    >
      <span className="text-xl mt-0.5 shrink-0">{CAT_ICON[n.category] || '🔔'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm truncate', isUnread ? 'font-semibold text-white' : 'font-medium')} style={!isUnread ? { color: themeColor } : undefined}>{n.title}</p>
          {isUnread && <span className="w-2 h-2 rounded-full shrink-0 bg-white" />}
        </div>
        <p className={cn('text-sm mt-0.5', isUnread ? 'text-white/80' : 'text-gray-500')}>{n.body}</p>
        <div className={cn('flex items-center gap-3 mt-1', isUnread ? 'text-white/60' : 'text-gray-400')}>
          <span className="text-xs">{timeAgo(n.createdAt)}</span>
          <span className="text-xs">by {n.senderName}</span>
          {n.category !== 'GENERAL' && <span className={cn('text-xs px-1.5 py-0.5 rounded', isUnread ? 'bg-white/20 text-white' : 'bg-white/60')}>{n.category}</span>}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(n.id); }} className={cn('opacity-0 group-hover:opacity-100 p-1 transition-opacity shrink-0', isUnread ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-red-500')} title="Delete">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
