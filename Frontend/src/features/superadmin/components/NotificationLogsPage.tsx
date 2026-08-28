'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationService, schoolService, orgService } from '@/lib/api';
import type { NotificationLogsResponse } from '@/types';
import { Card, Button, EmptyState } from '@/features/shared/components';
import Breadcrumbs from './parts/Breadcrumbs';
import PlatformStatus from './parts/PlatformStatus';
import NotificationLogsToolbar from './parts/NotificationLogsToolbar';
import NotificationLogsTable from './parts/NotificationLogsTable';
import NotificationLogsPagination from './parts/NotificationLogsPagination';

const PAGE_SIZE = 25;

export default function NotificationLogsPage() {
  const [data, setData] = useState<NotificationLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [page, setPage] = useState(1);
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [organizations, setOrganizations] = useState<{ value: string; label: string }[]>([]);
  const [organizationId, setOrganizationId] = useState('');

  useEffect(() => {
    orgService.getAll().then((orgs) => setOrganizations(orgs.map((o) => ({ value: o.id, label: `${o.name} (${o.code})` })))).catch(() => {});
  }, []);

  useEffect(() => {
    setSchoolId('');
    if (!organizationId) { setBranches([]); return; }
    schoolService.getAll(organizationId).then((schools) => {
      setBranches(schools.map((s) => ({ value: s.id, label: s.name })));
    }).catch(() => {});
  }, [organizationId]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setLoadError(false);
      try {
        setData(
          await notificationService.getLogs({
            schoolId: schoolId || undefined,
            channel: channel || undefined,
            status: status || undefined,
            page,
            pageSize: PAGE_SIZE,
          })
        );
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    },
    [schoolId, channel, status, page]
  );

  useEffect(() => { load(); }, [load]);

  const totalPages = useMemo(() => (data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1), [data]);

  const handleChannelChange = useCallback((value: string) => { setChannel(value); setPage(1); }, []);
  const handleStatusChange = useCallback((value: string) => { setStatus(value); setPage(1); }, []);
  const handleSchoolChange = useCallback((value: string) => { setSchoolId(value); setPage(1); }, []);
  const handlePageChange = useCallback((next: number) => setPage(next), []);
  const resetFilters = useCallback(() => { setOrganizationId(''); setSchoolId(''); setChannel(''); setStatus(''); setPage(1); }, []);

  return (
    <div className="min-h-full space-y-6 pb-8">
      <Breadcrumbs items={[{ label: 'Super Admin' }, { label: 'Notifications' }]} />
      <div className="relative overflow-hidden rounded-3xl bg-primary-700 p-5 text-white shadow-xl shadow-primary-200/40 sm:p-7">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Operations center</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Notification activity</h1><p className="mt-2 max-w-xl text-sm text-white/70">Monitor delivery health across organizations and their branches.</p></div>
          <Button variant="outline" size="sm" onClick={() => load(true)} loading={loading} className="border-white/25 bg-white/10 text-white hover:bg-white/20">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      <PlatformStatus />

      <NotificationLogsToolbar
        channel={channel}
        status={status}
        total={data ? data.total : null}
        onChannelChange={handleChannelChange}
        onStatusChange={handleStatusChange}
        schoolId={schoolId}
        organizationId={organizationId}
        organizationOptions={organizations}
        onOrganizationChange={(value) => { setOrganizationId(value); setPage(1); }}
        schoolOptions={branches.length > 0 ? branches : undefined}
        onSchoolChange={handleSchoolChange}
        onReset={resetFilters}
      />

      {loadError ? (
        <Card className="overflow-hidden rounded-3xl border-slate-200/80 shadow-sm">
          <EmptyState
            title="Failed to load logs"
            description="Something went wrong while fetching notification logs."
            action={<Button size="sm" onClick={() => load()} loading={loading}>Retry</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-3xl border-slate-200/80 shadow-sm">
          <NotificationLogsTable loading={loading} data={data} />
          {data && data.items.length > 0 && (
            <NotificationLogsPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </Card>
      )}
    </div>
  );
}
