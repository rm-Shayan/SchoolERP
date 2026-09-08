'use client';

import { useCallback, useEffect, useState } from 'react';
import { portalNotificationService } from '@/lib/api/portalNotifications';
import type { PortalNotification } from '@/lib/api/notificationService';
import { usePortalEvents } from '@/hooks/usePortalEvents';
import { formatDate } from '@/lib/utils';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { cn } from '@/lib/utils';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

export default function PortalNotificationBell() {
  const theme = getOrgThemeColor();
  const color = theme || '#4f46e5';
  const rgb = hexToRgb(color);
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
    setUnread(0);
  };

  const markAllLocal = async () => {
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
      <button
        onClick={openBell}
        aria-label="Notifications"
        className={cn(
          'relative p-2 rounded-lg transition-all duration-200',
          open ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
        )}
        style={open ? { backgroundColor: color } : undefined}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm"
            style={{ backgroundColor: color }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] sm:w-96 rounded-xl shadow-lg border z-50 overflow-hidden"
            style={{
              backgroundColor: '#fff',
              borderColor: `${color}18`,
              boxShadow: `0 4px 24px ${color}12, 0 2px 8px rgba(0,0,0,0.06)`,
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: `${color}15`, backgroundColor: `${color}06` }}
            >
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button onClick={markAllLocal} className="text-[11px] font-semibold hover:underline" style={{ color }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-[11px] text-gray-400 hover:text-gray-600">Close</button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center"><p className="text-sm text-gray-500">No notifications yet.</p></div>
              ) : items.map((n) => {
                const baseBg = n.isRead
                  ? 'transparent'
                  : rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)` : '#f8fafc';
                const hoverBg = n.isRead
                  ? (rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)` : '#f8fafc')
                  : (rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.10)` : '#f1f5f9');

                return (
                  <div
                    key={n.id}
                    className="group px-4 py-3 border-b border-gray-50 transition-all duration-150 cursor-pointer"
                    style={{ backgroundColor: baseBg }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = baseBg; }}
                    onClick={() => !n.isRead && markRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn('text-sm', n.isRead ? 'text-gray-700 font-medium' : 'font-semibold')}
                        style={!n.isRead ? { color } : undefined}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {!n.isRead && (
                        <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }} className="text-[11px] font-medium hover:underline" style={{ color }}>
                          Mark read
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); remove(n.id); }} className="text-[11px] text-gray-400 hover:text-red-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
