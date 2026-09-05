'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setPortalNotifications, removePortalNotification, setPortalUnread,
  markAllPortalRead, markPortalRead, addPortalNotification,
} from '@/store/slices/notificationsSlice';
import {
  usePortalNotificationsQuery,
  useUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} from '@/store/api';
import { cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import NotificationItem from './NotificationItem';

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const { school } = useAppSelector((s) => s.auth);
  const user = useAppSelector((s) => s.auth.user);
  const { portalItems, portalUnread } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  const schoolId = school?.id;
  const organizationId = user?.organizationId;

  // True unread count from server — always in sync (accurate on refresh, 0 when none).
  const { data: unread, refetch: refetchUnread } = useUnreadCountQuery(
    { schoolId, organizationId },
    { skip: !user },
  );

  useEffect(() => {
    if (typeof unread === 'number') dispatch(setPortalUnread(unread));
  }, [unread, dispatch]);

  // Dropdown items — fetch list only when opened.
  // Super admins don't have schoolId — pass empty params, backend scopes by JWT.
  const canFetch = !!open;
  const { data: portalData } = usePortalNotificationsQuery(
    { ...(schoolId && { schoolId }), ...(organizationId && { organizationId }), pageSize: 20 },
    { skip: !canFetch },
  );

  useEffect(() => {
    if (portalData) dispatch(setPortalNotifications(portalData.items));
  }, [portalData, dispatch]);

  const [markReadApi] = useMarkReadMutation();
  const [markAllReadApi] = useMarkAllReadMutation();
  const [deleteApi] = useDeleteNotificationMutation();

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllPortalRead());
    markAllReadApi(schoolId || undefined).catch(() => {});
  }, [schoolId, dispatch, markAllReadApi]);

  const handleMarkRead = useCallback((id: string) => {
    dispatch(markPortalRead([id]));
    markReadApi([id]).catch(() => {});
  }, [dispatch, markReadApi]);

  const handleDelete = useCallback((id: string) => {
    dispatch(removePortalNotification(id));
    deleteApi([id]).catch(() => {});
  }, [dispatch, deleteApi]);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open) return;
    handleMarkAllRead();
  }, [open, handleMarkAllRead]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onCreated = (n: any) => {
      dispatch(addPortalNotification(n));
      refetchUnread();
    };
    const onDeleted = ({ ids }: { ids: string[] }) => {
      ids.forEach((id: string) => dispatch(removePortalNotification(id)));
      refetchUnread();
    };
    const onRead = ({ ids }: { ids: string[] }) => {
      dispatch(markPortalRead(ids));
      refetchUnread();
    };
    const onAllRead = () => {
      dispatch(markAllPortalRead());
      refetchUnread();
    };
    socket.on('portal_notification_created', onCreated);
    socket.on('portal_notifications_deleted', onDeleted);
    socket.on('portal_notifications_read', onRead);
    socket.on('portal_all_read', onAllRead);
    return () => {
      socket.off('portal_notification_created', onCreated);
      socket.off('portal_notifications_deleted', onDeleted);
      socket.off('portal_notifications_read', onRead);
      socket.off('portal_all_read', onAllRead);
    };
  }, [dispatch, refetchUnread]);

  return (
    <div className="relative">
      <button onClick={toggle} className={cn('relative p-2 rounded-lg transition-colors', open ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')} aria-label="Notifications">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {portalUnread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{portalUnread > 9 ? '9+' : portalUnread}</span>}
      </button>
      {open && (<>
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <div className="flex items-center gap-3">
              {portalUnread > 0 && <button onClick={handleMarkAllRead} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">Mark all read</button>}
              <Link href="/notifications" onClick={() => setOpen(false)} className="text-[11px] text-gray-500 hover:text-gray-700">View all →</Link>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {portalItems.length === 0 ? <div className="px-4 py-10 text-center"><p className="text-sm text-gray-500">No notifications yet.</p></div>
              : portalItems.map((n) => <NotificationItem key={n.id} n={n} onRead={handleMarkRead} onDelete={handleDelete} />)}
          </div>
        </div>
      </>)}
    </div>
  );
}
