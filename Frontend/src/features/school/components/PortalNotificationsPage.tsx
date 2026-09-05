'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationService } from '@/lib/api';
import type { PortalNotification } from '@/lib/api/notificationService';
import { useAppSelector } from '@/store/hooks';
import { Card, PageHeader, Button, EmptyState } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';

const CAT_ICON: Record<string, string> = {
  PTM: '📅', HOMEWORK: '📝', EXAM: '📋', STAFF: '👤', STUDENT: '🎓', FEE: '💰', CIRCULAR: '📢', GENERAL: '🔔',
};
const CATS = ['', 'PTM', 'HOMEWORK', 'EXAM', 'STAFF', 'STUDENT', 'FEE', 'CIRCULAR', 'GENERAL'];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PortalNotificationsPage() {
  const { school } = useAppSelector((s) => s.auth);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

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
              <div key={n.id} onClick={() => !n.isRead && handleMarkRead(n.id)} className={cn('group flex cursor-pointer items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors', !n.isRead && 'bg-blue-50/20')}>
                <span className="text-xl mt-0.5 shrink-0">{CAT_ICON[n.category] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm truncate', n.isRead ? 'text-gray-700' : 'font-semibold text-gray-900')}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                    <span className="text-xs text-gray-400">by {n.senderName}</span>
                    {n.category !== 'GENERAL' && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{n.category}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(n.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity shrink-0" title="Delete">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
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
