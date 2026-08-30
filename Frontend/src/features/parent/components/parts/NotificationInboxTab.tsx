'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/features/shared/components';
import { portalNotificationService } from '@/lib/api/portalNotifications';
import type { PortalNotification } from '@/lib/api/notificationService';
import { usePortalEvents } from '@/hooks/usePortalEvents';
import { formatDate } from '@/lib/utils';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<string, string> = {
  ATTENDANCE: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  FEES: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  HOMEWORK: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  NOTICE: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  PTM: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  LEAVE: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
};

export default function NotificationInboxTab() {
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const theme = getOrgThemeColor();
  const { portalNotifications } = usePortalEvents();

  const fetchNotifications = useCallback(async () => {
    try {
      // Use portalDataService (correct auth) instead of notificationService (staff auth)
      const res = await portalNotificationService.getNotifications({ unreadOnly: filter === 'unread', pageSize: 50 });
      setItems(res.items);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Refresh when new portal notification arrives via socket
  useEffect(() => {
    if (portalNotifications.length > 0) fetchNotifications();
  }, [portalNotifications.length, fetchNotifications]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    await portalNotificationService.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkRead = async (id: string) => {
    await portalNotificationService.markRead([id]);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleDelete = async (id: string) => {
    await portalNotificationService.remove([id]);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: theme || '#6366f1' }}>{unreadCount} new</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['all', 'unread'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1 text-xs font-medium rounded-md transition', filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
                {f === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs font-medium px-3 py-1 rounded-lg hover:bg-gray-100 transition" style={{ color: theme || '#6366f1' }}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: theme ? `${theme}15` : '#f3f4f6' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={theme || '#9ca3af'}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">You'll see updates about attendance, fees, and homework here.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <NotificationCard key={n.id} notification={n} theme={theme} onMarkRead={handleMarkRead} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({ notification: n, theme, onMarkRead, onDelete }: { notification: PortalNotification; theme?: string; onMarkRead: (id: string) => void; onDelete: (id: string) => void }) {
  const iconPath = CATEGORY_ICONS[n.category] || CATEGORY_ICONS.NOTICE;
  return (
    <div className={cn('rounded-xl border p-4 transition-all hover:shadow-sm', n.isRead ? 'bg-white border-gray-100' : 'bg-white shadow-sm')}
      style={!n.isRead ? { borderLeftWidth: '4px', borderLeftColor: theme || '#6366f1' } : undefined}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: theme ? `${theme}15` : '#f3f4f6' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={theme || '#6b7280'}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn('text-sm font-semibold', n.isRead ? 'text-gray-700' : 'text-gray-900')}>{n.title}</h4>
            <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">{formatDate(n.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{n.category}</span>
            {!n.isRead && (
              <button onClick={() => onMarkRead(n.id)} className="text-[11px] font-medium hover:underline" style={{ color: theme || '#6366f1' }}>Mark read</button>
            )}
            <button onClick={() => onDelete(n.id)} className="text-[11px] text-gray-400 hover:text-red-500 font-medium ml-auto">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
