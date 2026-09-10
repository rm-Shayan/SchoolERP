'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { portalNotificationService } from '@/lib/api/portalNotifications';
import type { PortalNotification } from '@/lib/api/notificationService';
import { usePortalEvents } from '@/hooks/usePortalEvents';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { cn } from '@/lib/utils';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function PortalNotificationItem({ n, onRead, onDelete }: {
  n: PortalNotification; onRead: (id: string) => void; onDelete: (id: string) => void;
}) {
  return (
    <div
      onClick={() => !n.isRead && onRead(n.id)}
      className={cn(
        'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-100',
        !n.isRead ? 'bg-sky-50/60 hover:bg-sky-100/70' : 'hover:bg-gray-100/80',
        'border-b border-gray-100 last:border-b-0',
      )}
    >
      <span className="text-lg mt-0.5 shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">🔔</span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[13px] leading-snug', !n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
        <span className="text-[11px] text-gray-400 mt-1 block">{timeAgo(n.createdAt)}</span>
      </div>
      <div className="shrink-0 mt-2">
        {!n.isRead && <span className="block w-2 h-2 rounded-full bg-blue-500" />}
      </div>
    </div>
  );
}

export default function PortalNotificationBell() {
  const color = getOrgThemeColor() || '#6366f1';
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const { portalNotifications } = usePortalEvents();
  const ref = useRef<HTMLDivElement>(null);

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

  const openBell = () => { setOpen((o) => !o); setUnread(0); };

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

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openBell}
        aria-label="Notifications"
        className={cn(
          'relative p-2 rounded-full transition-colors duration-150',
          open ? 'bg-black/[0.08] text-gray-900' : 'text-gray-500 hover:bg-black/[0.06] hover:text-gray-700',
        )}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
            {unread > 99 ? '99+' : unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-lg border border-gray-200 z-50 overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllLocal} className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors">
                  Mark all as read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors">
                View all
              </button>
            </div>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-16 text-center"><p className="text-sm font-medium text-gray-500">No notifications yet</p></div>
            ) : items.map((n) => (
              <PortalNotificationItem key={n.id} n={n} onRead={markRead} onDelete={remove} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
