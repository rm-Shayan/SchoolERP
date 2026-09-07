'use client';

import { useCallback, useEffect, useState } from 'react';
import { portalNotificationService } from '@/lib/api/portalNotifications';
import type { PortalNotification } from '@/lib/api/notificationService';
import { usePortalEvents } from '@/hooks/usePortalEvents';
import { formatDate } from '@/lib/utils';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { cn } from '@/lib/utils';

export default function PortalNotificationBell() {
  const theme = getOrgThemeColor();
  const color = theme || '#4f46e5';
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const { portalNotifications } = usePortalEvents();

  const load = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        portalNotificationService.getNotifications({ pageSize: 30 }),
        portalNotificationService.getUnreadCount(),
      ]);
      setItems(list.items);
      setUnread(count);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (portalNotifications.length) load(); }, [portalNotifications.length, load]);

  const openBell = () => {
    const next = !open;
    setOpen(next);
    // On bell click, always hide the badge count — whether opening or closing.
    // (When opening, all visible items are marked as read; even in closed state
    //  the count should not reappear.)
    setUnread(0);
  };

  const markALlLocal = async () => {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await portalNotificationService.markAllRead().catch(() => {});
  };

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await portalNotificationService.markRead([id]).catch(() => {});
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await portalNotificationService.remove([id]).catch(() => {});
  };

  return (
    <div className="relative">
      <button onClick={openBell} aria-label="Notifications" className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <button onClick={() => setOpen(false)} className="text-[11px] text-gray-400 hover:text-gray-600">Close</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center"><p className="text-sm text-gray-500">No notifications yet.</p></div>
              ) : items.map((n) => (
                <div key={n.id} className={cn('px-4 py-3 border-b border-gray-50', !n.isRead && 'bg-blue-50/30')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm', n.isRead ? 'text-gray-700' : 'font-semibold text-gray-900')}>{n.title}</p>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {!n.isRead && (
                      <button onClick={() => markRead(n.id)} className="text-[11px] font-medium" style={{ color }}>Mark read</button>
                    )}
                    <button onClick={() => remove(n.id)} className="text-[11px] text-gray-400 hover:text-red-500 ml-auto">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
