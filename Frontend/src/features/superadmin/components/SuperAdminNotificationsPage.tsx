'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationService, schoolService, orgService } from '@/lib/api';
import type { PortalNotification } from '@/lib/api/notificationService';
import { useAppSelector } from '@/store/hooks';
import { Card, PageHeader, Button, EmptyState, Select } from '@/features/shared/components';
import { getSocket } from '@/lib/socket';
import SendNotificationForm from './SendNotificationForm';
import SuperAdminNotificationItem from './parts/SuperAdminNotificationItem';

const CATS = ['', 'PTM', 'HOMEWORK', 'EXAM', 'STAFF', 'STUDENT', 'FEE', 'CIRCULAR', 'GENERAL'];

export default function SuperAdminNotificationsPage() {
  const { school, organization } = useAppSelector((s) => s.auth);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showSend, setShowSend] = useState(false);
  const themeColor = organization?.themeColor || '#6366f1';
  const [organizations, setOrganizations] = useState<{ value: string; label: string }[]>([]);
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => { orgService.getAll().then((o) => setOrganizations(o.map((x) => ({ value: x.id, label: x.name })))).catch(() => {}); }, []);
  useEffect(() => {
    setSchoolId('');
    if (!organizationId) { setBranches([]); return; }
    schoolService.getAll(organizationId).then((s) => setBranches(s.map((x) => ({ value: x.id, label: x.name })))).catch(() => {});
  }, [organizationId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getPortal({ schoolId: schoolId || school?.id || undefined, organizationId: organizationId || undefined, category: category || undefined, page, pageSize: 20 });
      setItems(res.items); setTotal(res.total);
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
    return () => { socket.off('portal_notification_created', refresh); socket.off('portal_notifications_deleted', refresh); socket.off('portal_notifications_read', refresh); socket.off('portal_all_read', refresh); };
  }, [load]);

  const handleDelete = async (id: string) => { setItems((p) => p.filter((n) => n.id !== id)); await notificationService.remove([id]).catch(() => load()); };
  const handleMarkRead = async (id: string) => { setItems((p) => p.map((n) => n.id === id ? { ...n, isRead: true } : n)); await notificationService.markRead([id]).catch(() => load()); };
  const resetFilters = () => { setOrganizationId(''); setSchoolId(''); setCategory(''); setPage(1); };

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Notifications" description="Portal notifications across organizations." actions={<div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setShowSend(!showSend)}>{showSend ? 'Close' : 'Send Notification'}</Button><Button variant="outline" size="sm" onClick={() => load()} loading={loading}>Refresh</Button></div>} />
      {showSend && <SendNotificationForm onSent={load} />}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <div className="w-full sm:w-56"><Select label="Organization" value={organizationId} onChange={(e) => { setOrganizationId(e.target.value); setPage(1); }} placeholder="All organizations" options={organizations} /></div>
        {branches.length > 0 && <div className="w-full sm:w-48"><Select label="Branch" value={schoolId} onChange={(e) => { setSchoolId(e.target.value); setPage(1); }} placeholder="All branches" options={branches} /></div>}
        <div className="w-full sm:w-44"><Select label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} placeholder="All categories" options={CATS.map((c) => ({ value: c, label: c || 'All' }))} /></div>
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
            {items.map((n) => <SuperAdminNotificationItem key={n.id} n={n} themeColor={themeColor} onRead={handleMarkRead} onDelete={handleDelete} />)}
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
