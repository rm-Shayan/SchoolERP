'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useRouter } from 'next/navigation';
import { notificationService } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import type { NotificationLogsResponse } from '@/types';
import { Card, PageHeader, Button, EmptyState } from '@/features/shared/components';
import NotificationLogsToolbar from '@/features/superadmin/components/parts/NotificationLogsToolbar';
import NotificationLogsTable from '@/features/superadmin/components/parts/NotificationLogsTable';
import NotificationLogsPagination from '@/features/superadmin/components/parts/NotificationLogsPagination';

const PAGE_SIZE = 25;

export default function NotificationLogsPage() {
  const { isAdmin } = useRoleAccess();
  const router = useRouter();
  if (!isAdmin) { router.replace('/branch/dashboard'); return null; }
  const { school } = useAppSelector((s) => s.auth);
  const [data, setData] = useState<NotificationLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setLoadError(false);
      try {
        setData(
          await notificationService.getLogs({
            schoolId: school?.id,
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
    [school?.id, channel, status, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = useMemo(() => (data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1), [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Logs"
        description="Parent and staff notifications for this branch — which message went to whom, when, and its status."
        actions={
          <Button variant="outline" size="sm" onClick={() => load(true)} loading={loading}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        }
      />

      <NotificationLogsToolbar
        channel={channel}
        status={status}
        total={data ? data.total : null}
        onChannelChange={setChannel}
        onStatusChange={setStatus}
      />

      {loadError ? (
        <Card className="overflow-hidden">
          <EmptyState
            title="Failed to load logs"
            description="Something went wrong while fetching notification logs."
            action={<Button size="sm" onClick={() => load()} loading={loading}>Retry</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <NotificationLogsTable loading={loading} data={data} />
          {data && data.items.length > 0 && (
            <NotificationLogsPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </Card>
      )}
    </div>
  );
}
