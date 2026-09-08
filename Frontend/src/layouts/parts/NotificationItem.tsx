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

  // LinkedIn/YouTube style: subtle tint for unread, transparent for read
  // On hover: slightly more prominent tint
  const baseBg = n.isRead
    ? 'transparent'
    : rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)` : '#f8fafc';
  const hoverBg = n.isRead
    ? (rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)` : '#f8fafc')
    : (rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.10)` : '#f1f5f9');

  return (
    <div
      onClick={() => !n.isRead && onRead(n.id)}
      className="group cursor-pointer px-4 py-3 border-b border-gray-50 transition-all duration-150"
      style={{
        backgroundColor: baseBg,
        // CSS hover via onMouseEnter/Leave for reliable inline style override
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = baseBg; }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-base mt-0.5 shrink-0">{CAT_ICON[n.category] || '🔔'}</span>
          <div className="min-w-0">
            <p
              className={cn('text-sm', n.isRead ? 'font-medium text-gray-700' : 'font-semibold')}
              style={!n.isRead ? { color: tc } : undefined}
            >
              {n.title}
            </p>
            <p className={cn('text-xs mt-0.5 line-clamp-2', n.isRead ? 'text-gray-500' : 'text-gray-600')}>
              {n.body}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('text-[10px] whitespace-nowrap', n.isRead ? 'text-gray-400' : 'text-gray-500')}>
            {timeAgo(n.createdAt)}
          </span>
          {!n.isRead && (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tc }} />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
