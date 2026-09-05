'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/features/shared/components';
import { portalNotificationService } from '@/lib/api/portalNotifications';
import type { PortalNotification } from '@/lib/api/notificationService';
import { formatDate } from '@/lib/utils';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { cn } from '@/lib/utils';

const CAT_COLORS: Record<string, string> = {
  HOMEWORK: 'bg-blue-100 text-blue-700', FEE_PAID: 'bg-green-100 text-green-700', FEE_DUE: 'bg-amber-100 text-amber-700',
  ATTENDANCE_LATE: 'bg-red-100 text-red-700', ATTENDANCE_ABSENT: 'bg-red-100 text-red-700',
  PTM_CREATED: 'bg-purple-100 text-purple-700', PTM_UPDATED: 'bg-purple-100 text-purple-700',
  EXAM_CREATED: 'bg-orange-100 text-orange-700', EXAM_PUBLISHED: 'bg-orange-100 text-orange-700',
  LEAVE_REQUEST: 'bg-indigo-100 text-indigo-700', LEAVE_APPROVED: 'bg-green-100 text-green-700',
  LEAVE_REJECTED: 'bg-red-100 text-red-700', CIRCULAR: 'bg-teal-100 text-teal-700',
  CONDUCT_REMARK: 'bg-pink-100 text-pink-700',
};

export default function NotificationsTab() {
  const theme = getOrgThemeColor();
  const color = theme || '#6366f1';
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    try {
      const data = await portalNotificationService.getNotifications({ pageSize: 100 });
      setItems(data.items);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await portalNotificationService.markRead([id]).catch(() => {});
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await portalNotificationService.markAllRead().catch(() => {});
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await portalNotificationService.remove([id]).catch(() => {});
  };

  const filtered = filter === 'unread' ? items.filter((n) => !n.isRead) : items;
  const unreadCount = items.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {(['all', 'unread'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                filter === f ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100')}
              style={filter === f ? { background: color } : undefined}>
              {f === 'all' ? 'All' : 'Unread'}{f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs font-medium hover:underline" style={{ color }}>
            Mark all read
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-gray-500">{filter === 'unread' ? 'All caught up! No unread notifications.' : 'No notifications yet.'}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div key={n.id} className={cn('transition-colors hover:shadow-md cursor-pointer rounded-xl', !n.isRead && 'border-l-2')}
              style={!n.isRead ? { borderLeftColor: color } : undefined}
              onClick={() => !n.isRead && markRead(n.id)}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', CAT_COLORS[n.category] || 'bg-gray-100 text-gray-600')}>
                          {n.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatDate(n.createdAt)}</span>
                      </div>
                      <h4 className={cn('text-sm mt-1', n.isRead ? 'text-gray-600' : 'font-semibold text-gray-900')}>{n.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
