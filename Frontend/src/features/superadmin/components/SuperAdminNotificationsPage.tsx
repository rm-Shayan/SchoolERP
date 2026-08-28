'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationService, schoolService, orgService } from '@/lib/api';
import type { PortalNotification } from '@/lib/api/notificationService';
import { useAppSelector } from '@/store/hooks';
import { Card, PageHeader, Button, EmptyState, Select } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import SendNotificationForm from './SendNotificationForm';

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

export default function SuperAdminNotificationsPage() {
  const { school } = useAppSelector((s) => s.auth);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showSend, setShowSend] = useState(false);

  // Org / Branch filters
  const [organizations, setOrganizations] = useState<{ value: string; label: string }[]>([]);
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    orgService.getAll().then((orgs) => setOrganizations(orgs.map((o) => ({ value: o.id, label: o.name })))).catch(() => {});
  }, []);

  useEffect(() => {
    setSchoolId('');
    if (!organizationId) { setBranches([]); return; }
    schoolService.getAll(organizationId).then((schools) => {
      setBranches(schools.map((s) => ({ value: s.id, label: s.name })));
    }).catch(() => {});
  }, [organizationId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getPortal({
        schoolId: schoolId || school?.id || undefined,
        organizationId: organizationId || undefined,
        category: category || undefined,
        page, pageSize: 20,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch { /* noop */ }
    setLoading(false);
  }, [schoolId, school?.id, organizationId, category, page]);

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
    return () => {
      socket.off('portal_notification_created', refresh);
      socket.off('portal_notifications_deleted', refresh);
      socket.off('portal_notifications_read', refresh);
      socket.off('portal_all_read', refresh);
    };
  }, [load]);

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await notificationService.remove([id]).catch(() => load());
  };

  const resetFilters = () => { setOrganizationId(''); setSchoolId(''); setCategory(''); setPage(1); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Notifications"
        description="Portal notifications across organizations. Filter by org and branch."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSend(!showSend)}>
              {showSend ? 'Close' : 'Send Notification'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => load()} loading={loading}>Refresh</Button>
          </div>
        }
      />

      {showSend && <SendNotificationForm onSent={load} />}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <div className="w-full sm:w-56">
          <Select label="Organization" value={organizationId} onChange={(e) => { setOrganizationId(e.target.value); setPage(1); }} placeholder="All organizations" options={organizations} />
        </div>
        {branches.length > 0 && (
          <div className="w-full sm:w-48">
            <Select label="Branch" value={schoolId} onChange={(e) => { setSchoolId(e.target.value); setPage(1); }} placeholder="All branches" options={branches} />
          </div>
        )}
        <div className="w-full sm:w-44">
          <Select label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} placeholder="All categories" options={CATS.map((c) => ({ value: c, label: c || 'All' }))} />
        </div>
        <button onClick={resetFilters} className="h-10 rounded-lg px-3 text-xs font-medium text-primary-600 hover:bg-primary-50">Reset</button>
        <span className="ml-auto text-xs text-gray-400">{total} notification(s)</span>
      </div>

      <Card className="overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <EmptyState title="No notifications" description="Notifications from across all organizations will appear here." />
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((n) => (
              <div key={n.id} className="group flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                <span className="text-xl mt-0.5 shrink-0">{CAT_ICON[n.category] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
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
