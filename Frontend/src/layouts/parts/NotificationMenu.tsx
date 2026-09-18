'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
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
import NotificationItem from './NotificationItem';
import NotificationBellButton from './NotificationBellButton';

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const { school, organization } = useAppSelector((s) => s.auth);
  const user = useAppSelector((s) => s.auth.user);
  const { portalItems, portalUnread } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  const menuRef = useRef<HTMLDivElement>(null);
  const schoolId = school?.id;
  const organizationId = user?.organizationId;
  const themeColor = organization?.themeColor || getOrgThemeColor();

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
      <NotificationBellButton open={open} count={portalUnread} themeColor={themeColor} onToggle={toggle} />

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
