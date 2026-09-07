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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

export default function PortalNotificationsPage() {
  const { school, organization } = useAppSelector((s) => s.auth);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const themeColor = organization?.themeColor || school?.themeColor || '#6366f1';
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
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={cn(
                  'group flex cursor-pointer items-start gap-3 px-5 py-3.5 transition-colors',
                  n.isRead ? 'hover:brightness-95' : 'hover:brightness-95',
                )}
                style={!n.isRead
                  ? { backgroundColor: themeColor, color: '#fff' }
                  : unreadBg ? { backgroundColor: unreadBg, color: themeColor } : undefined}
              >
                <span className="text-xl mt-0.5 shrink-0">{CAT_ICON[n.category] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm truncate', n.isRead ? 'font-medium' : 'font-semibold text-white')} style={!n.isRead ? undefined : { color: themeColor }}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full shrink-0 bg-white" />}
                  </div>
                  <p className={cn('text-sm mt-0.5', n.isRead ? 'text-gray-500' : 'text-white/80')}>{n.body}</p>
                  <div className={cn('flex items-center gap-3 mt-1', n.isRead ? 'text-gray-400' : 'text-white/60')}>
                    <span className="text-xs">{timeAgo(n.createdAt)}</span>
                    <span className="text-xs">by {n.senderName}</span>
                    {n.category !== 'GENERAL' && <span className={cn('text-xs px-1.5 py-0.5 rounded', n.isRead ? 'bg-white/60' : 'bg-white/20 text-white')}>{n.category}</span>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} className={cn('opacity-0 group-hover:opacity-100 p-1 transition-opacity shrink-0', n.isRead ? 'text-gray-400 hover:text-red-500' : 'text-white/60 hover:text-white')} title="Delete">
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
