'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { notificationService } from '@/lib/api';
import type { PortalNotification } from '@/lib/api/notificationService';
import { useAppSelector } from '@/store/hooks';
import { Card, PageHeader, Button, EmptyState } from '@/features/shared/components';
import { getPortalThemeColor } from '@/lib/utils/orgTheme';
import { getSocket } from '@/lib/socket';
import { CATS, hexToRgb } from './parts/notificationMeta';
import { NotificationRow } from './parts/NotificationRow';

export default function PortalNotificationsPage() {
  const { isAdmin } = useRoleAccess();
  const { school } = useAppSelector((s) => s.auth);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const themeColor = school?.themeColor || getPortalThemeColor() || '#7c3aed';
  const rgb = hexToRgb(themeColor);
  const unreadBg = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)` : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getPortal({ schoolId: school?.id, category: category || undefined, unreadOnly, page, pageSize: 20 });
      setItems(res.items);
      setTotal(res.total);
    } catch { /* noop */ }
    setLoading(false);
  }, [school?.id, category, unreadOnly, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 20)), [total]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => load();
    socket.on('portal_notification_created', refresh);
    socket.on('portal_notifications_deleted', refresh);
    socket.on('portal_notifications_read', refresh);
    socket.on('portal_all_read', refresh);
    return () => { socket.off('portal_notification_created', refresh); socket.off('portal_notifications_deleted', refresh); socket.off('portal_notifications_read', refresh); socket.off('portal_all_read', refresh); };
  }, [load]);

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await notificationService.remove([id]).catch(() => load());
  };

  const handleMarkRead = async (id: string) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    await notificationService.markRead([id]).catch(() => load());
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await notificationService.markAllRead(school?.id).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Portal notifications — actions, alerts, and updates for your branch."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>
            <Button variant="outline" size="sm" onClick={() => load()} loading={loading}>Refresh</Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="text-sm border rounded-lg px-3 py-1.5">
          {CATS.map((c) => <option key={c} value={c}>{c || 'All categories'}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }} className="rounded" />
          Unread only
        </label>
        <span className="text-xs text-gray-400 ml-auto">{total} notification(s)</span>
      </div>

      <Card className="overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <EmptyState title="No notifications" description="When something happens, you'll see it here." />
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((n) => (
              <NotificationRow key={n.id} n={n} themeColor={themeColor} unreadBg={unreadBg} isAdmin={isAdmin} onRead={handleMarkRead} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 border-t">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
