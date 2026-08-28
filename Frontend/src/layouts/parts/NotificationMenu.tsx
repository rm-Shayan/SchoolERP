'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setPortalNotifications, setPortalUnread, removePortalNotification, markAllPortalRead, addPortalNotification, markPortalRead,
} from '@/store/slices/notificationsSlice';
import { notificationService } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';

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

export default function NotificationMenu({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { school } = useAppSelector((s) => s.auth);
  const { portalItems, portalUnread } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  const schoolId = school?.id;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [portal, unread] = await Promise.all([
        notificationService.getPortal({ schoolId, pageSize: 20 }),
        notificationService.getUnreadCount(schoolId),
      ]);
      dispatch(setPortalNotifications(portal.items));
      dispatch(setPortalUnread(unread));
    } catch { /* noop */ }
    setLoading(false);
  }, [schoolId, dispatch]);

  const handleDelete = useCallback(async (id: string) => {
    dispatch(removePortalNotification(id));
    await notificationService.remove([id]).catch(() => {});
  }, [dispatch]);

  const handleMarkAllRead = useCallback(async () => {
    dispatch(markAllPortalRead());
    await notificationService.markAllRead(schoolId).catch(() => {});
  }, [schoolId, dispatch]);

  const handleMarkRead = useCallback(async (id: string) => {
    dispatch(markPortalRead([id]));
    await notificationService.markRead([id]).catch(() => {});
  }, [dispatch]);

  // Fetch unread count on mount so badge shows immediately
  useEffect(() => {
    notificationService.getUnreadCount(schoolId).then((c) => dispatch(setPortalUnread(c))).catch(() => {});
  }, [schoolId, dispatch]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  // Realtime updates — always active (not just when menu is open)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onCreated = (notification: any) => dispatch(addPortalNotification(notification));
    const onDeleted = ({ ids }: { ids: string[] }) => { ids.forEach((id) => dispatch(removePortalNotification(id))); };
    const onRead = ({ ids }: { ids: string[] }) => dispatch(markPortalRead(ids));
    const onAllRead = () => dispatch(markAllPortalRead());
    socket.on('portal_notification_created', onCreated);
    socket.on('portal_notifications_deleted', onDeleted);
    socket.on('portal_notifications_read', onRead);
    socket.on('portal_all_read', onAllRead);
    return () => { socket.off('portal_notification_created', onCreated); socket.off('portal_notifications_deleted', onDeleted); socket.off('portal_notifications_read', onRead); socket.off('portal_all_read', onAllRead); };
  }, [dispatch]);

  return (
    <div className="relative">
      <button onClick={toggle} className={cn('relative p-2 rounded-lg transition-colors', open ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')} aria-label="Notifications">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {portalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {portalUnread > 9 ? '9+' : portalUnread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <div className="flex items-center gap-2">
                {portalUnread > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[11px] text-primary-600 hover:text-primary-700 font-medium">
                    Mark all read
                  </button>
                )}
                <Link href="/notifications" onClick={() => setOpen(false)} className="text-[11px] text-gray-500 hover:text-gray-700">
                  View all →
                </Link>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading && portalItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
              ) : portalItems.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-gray-500">No notifications yet.</p>
                </div>
              ) : (
                portalItems.map((n) => (
                  <div key={n.id} onClick={() => !n.isRead && handleMarkRead(n.id)} className={cn('group cursor-pointer px-4 py-3 border-b border-gray-50 hover:bg-gray-50/60 transition-colors', !n.isRead && 'bg-blue-50/30')}>
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
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
