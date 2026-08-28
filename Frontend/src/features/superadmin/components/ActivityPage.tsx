'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { auditLogService } from '@/lib/api';
import type { AuditLogsResponse } from '@/types';
import { Card, PageHeader, Button, EmptyState } from '@/features/shared/components';
import ActivityToolbar from './parts/ActivityToolbar';
import ActivityTable from './parts/ActivityTable';
import ActivityPagination from './parts/ActivityPagination';

const PAGE_SIZE = 25;

export default function ActivityPage() {
  const [data, setData] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setLoadError(false);
      try {
        const res = await auditLogService.list({
          search: search || undefined,
          action: action || undefined,
          entityType: entityType || undefined,
          page,
          pageSize: PAGE_SIZE,
        });
        setData(res);
      } catch (err) {
        console.error('Failed to load activity log:', err);
        setLoadError(true);
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [search, action, entityType, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1),
    [data]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleActionChange = useCallback((value: string) => {
    setAction(value);
    setPage(1);
  }, []);

  const handleEntityTypeChange = useCallback((value: string) => {
    setEntityType(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((next: number) => {
    setPage(next);
  }, []);

  const showPagination = data !== null && data.items.length > 0;
  const isFiltered = !!search || !!action || !!entityType;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Logins, block/unblock actions, and organization/branch/staff changes across the platform."
        actions={
          <Button variant="outline" size="sm" onClick={() => load(true)} loading={refreshing}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        }
      />

      <ActivityToolbar
        search={search}
        action={action}
        entityType={entityType}
        total={data ? data.total : null}
        onSearchChange={handleSearchChange}
        onActionChange={handleActionChange}
        onEntityTypeChange={handleEntityTypeChange}
      />

      {loadError ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            title="Failed to load activity"
            description="Something went wrong while fetching the activity log. Try again."
            action={
              <Button size="sm" onClick={() => load()} loading={loading}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ActivityTable loading={loading} data={data} isFiltered={isFiltered} />
          {showPagination && (
            <ActivityPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </Card>
      )}
    </div>
  );
}
