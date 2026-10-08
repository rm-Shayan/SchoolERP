'use client';

import type { PortalNotification } from '@/lib/api/notificationService';
import { cn } from '@/lib/utils';
import { CAT_ICON, timeAgo } from './notificationMeta';

interface NotificationRowProps {
  n: PortalNotification;
  themeColor: string;
  unreadBg?: string;
  isAdmin: boolean;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationRow({ n, themeColor, unreadBg, isAdmin, onRead, onDelete }: NotificationRowProps) {
  return (
    <div
      onClick={() => !n.isRead && onRead(n.id)}
      className="group flex cursor-pointer items-start gap-3 px-5 py-3.5 transition-colors hover:brightness-95"
      style={!n.isRead
        ? { backgroundColor: themeColor, color: '#fff' }
        : unreadBg ? { backgroundColor: unreadBg, color: themeColor } : undefined}
    >
      <span className="text-xl mt-0.5 shrink-0">{CAT_ICON[n.category] || '🔔'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm truncate', n.isRead ? 'font-medium' : 'font-semibold text-white')} style={!n.isRead ? undefined : { color: themeColor }}>{n.title}</p>
          {!n.isRead && <span className="w-2 h-2 rounded-full shrink-0 bg-white" />}
        </div>
        <p className={cn('text-sm mt-0.5', n.isRead ? 'text-gray-500' : 'text-white/80')}>{n.body}</p>
        <div className={cn('flex items-center gap-3 mt-1', n.isRead ? 'text-gray-400' : 'text-white/60')}>
          <span className="text-xs">{timeAgo(n.createdAt)}</span>
          <span className="text-xs">by {n.senderName}</span>
          {n.category !== 'GENERAL' && <span className={cn('text-xs px-1.5 py-0.5 rounded', n.isRead ? 'bg-white/60' : 'bg-white/20 text-white')}>{n.category}</span>}
        </div>
      </div>
      {isAdmin && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(n.id); }} className={cn('opacity-0 group-hover:opacity-100 p-1 transition-opacity shrink-0', n.isRead ? 'text-gray-400 hover:text-red-500' : 'text-white/60 hover:text-white')} title="Delete">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}
