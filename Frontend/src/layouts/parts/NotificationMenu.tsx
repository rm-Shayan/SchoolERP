'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setPortalNotifications, removePortalNotification, setPortalUnread,
  markAllPortalRead, markPortalRead,
} from '@/store/slices/notificationsSlice';
import {
  usePortalNotificationsQuery,
  useUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} from '@/store/api';
import { cn } from '@/lib/utils';
import NotificationItem from './NotificationItem';

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const { school, organization } = useAppSelector((s) => s.auth);
  const user = useAppSelector((s) => s.auth.user);
  const { portalItems, portalUnread } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  const menuRef = useRef<HTMLDivElement>(null);
  const schoolId = school?.id;
  const organizationId = user?.organizationId;
  const themeColor = organization?.themeColor || school?.themeColor || '#6366f1';

  const { data: unread, refetch: refetchUnread } = useUnreadCountQuery(
    { schoolId, organizationId },
    { skip: !user, pollingInterval: 30000 },
  );

  useEffect(() => {
    if (typeof unread === 'number') dispatch(setPortalUnread(unread));
  }, [unread, dispatch]);

  const canFetch = !!open;
  const { data: portalData } = usePortalNotificationsQuery(
    { ...(schoolId && { schoolId }), ...(organizationId && { organizationId }), pageSize: 20 },
    { skip: !canFetch },
  );

  useEffect(() => {
    if (portalData) dispatch(setPortalNotifications(portalData.items));
  }, [portalData, dispatch]);

  useEffect(() => {
    if (open && portalUnread > 0) {
      dispatch(markAllPortalRead(schoolId || undefined));
      markAllReadApi(schoolId || undefined).catch(() => {});
    }
  }, [open]);

  const [markReadApi] = useMarkReadMutation();
  const [markAllReadApi] = useMarkAllReadMutation();
  const [deleteApi] = useDeleteNotificationMutation();

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllPortalRead(schoolId || undefined));
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

  // Close on outside click (LinkedIn behavior)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell button — LinkedIn style: light bg when open, not solid color */}
      <button
        onClick={toggle}
        className={cn(
          'relative p-2 rounded-full transition-colors duration-150',
          open
            ? 'bg-black/[0.08] text-gray-900'
            : 'text-gray-500 hover:bg-black/[0.06] hover:text-gray-700',
        )}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {portalUnread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
            style={{ backgroundColor: themeColor }}
          >
            {portalUnread > 99 ? '99+' : portalUnread > 9 ? '9+' : portalUnread}
          </span>
        )}
      </button>

      {/* Dropdown — LinkedIn style */}
      {open && (
        <div
          className="absolute right-0 mt-1 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-lg border border-gray-200 z-50 overflow-hidden"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {portalUnread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
              >
                View all
              </Link>
            </div>
          </div>

          {/* Items */}
          <div className="max-h-[480px] overflow-y-auto">
            {portalItems.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="text-sm font-medium text-gray-500">No notifications yet</p>
              </div>
            ) : (
              portalItems.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  themeColor={themeColor}
                  onRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
