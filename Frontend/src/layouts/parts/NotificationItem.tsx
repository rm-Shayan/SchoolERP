'use client';

import { cn } from '@/lib/utils';
import type { PortalNotification } from '@/lib/api/notificationService';

const CAT_ICON: Record<string, string> = {
  PTM: '📅', HOMEWORK: '📝', EXAM: '📋', STAFF: '👤', STUDENT: '🎓', FEE: '💰', CIRCULAR: '📢', GENERAL: '🔔', ADMISSION: '🎓', LEAVE: '🏖️', ATTENDANCE: '✅', CONDUCT: '⭐',
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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

interface Props {
  n: PortalNotification;
  themeColor?: string | null;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({ n, themeColor, onRead, onDelete }: Props) {
  const tc = themeColor || '#6366f1';
  const rgb = hexToRgb(tc);
  const unreadBg = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)` : undefined;

  return (
    <div
      onClick={() => !n.isRead && onRead(n.id)}
      className={cn(
        'group cursor-pointer px-4 py-3 border-b border-gray-50 hover:bg-gray-50/60 transition-colors',
      )}
      style={!n.isRead ? { backgroundColor: tc, color: '#fff' } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-base mt-0.5 shrink-0">{CAT_ICON[n.category] || '🔔'}</span>
          <div className="min-w-0">
            <p className={cn('text-sm', n.isRead ? 'text-gray-500' : 'font-semibold text-white')}>{n.title}</p>
            <p className={cn('text-xs mt-0.5 line-clamp-2', n.isRead ? 'text-gray-400' : 'text-white/80')}>{n.body}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('text-[10px] whitespace-nowrap', n.isRead ? 'text-gray-400' : 'text-white/60')}>{timeAgo(n.createdAt)}</span>
          {!n.isRead && <span className="w-2 h-2 rounded-full shrink-0 bg-white" />}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
            className={cn('opacity-0 group-hover:opacity-100 p-0.5 transition-opacity', n.isRead ? 'text-gray-400 hover:text-red-500' : 'text-white/60 hover:text-white')}
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
