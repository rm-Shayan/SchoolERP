'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { staffService } from '@/lib/api';
import type { User } from '@/types';
import { PageHeader, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import UsersStats from './parts/UsersStats';
import UsersToolbar from './parts/UsersToolbar';
import UsersTable from './parts/UsersTable';
import { UsersSkeleton } from './parts/UsersSkeleton';
import BlockReasonDialog from './parts/BlockReasonDialog';
import UserProfileModal from './parts/UserProfileModal';
import Breadcrumbs from './parts/Breadcrumbs';
import { useUserBlocking } from './parts/useUserBlocking';
import CreateUserModal from './parts/CreateUserModal';
import { usePlatformUsers } from '../hooks/usePlatformUsers';

export default function UsersPage() {
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    data, setData, loading, search, setSearch,
    roleFilter, setRoleFilter, statusFilter, setStatusFilter, reasonFilter, setReasonFilter,
    page, setPage, reload, resetFilters,
  } = usePlatformUsers();

  const { user: currentUser } = useAppSelector((s) => s.auth);
  const visibleData = useMemo(() => {
    if (!data || !currentUser?.id) return data;
    const items = data.items.filter((member) => member.id !== currentUser.id);
    return { ...data, items, total: Math.max(0, data.total - (items.length < data.items.length ? 1 : 0)) };
  }, [data, currentUser?.id]);
  const visibleItems = visibleData?.items ?? [];
  const visibleTotalPages = Math.max(1, Math.ceil((visibleData?.total ?? 0) / 10));
  const { blockTarget, setBlockTarget, busy, confirmBlock, confirmUnblock } = useUserBlocking({
    setData,
    reload,
  });

  const handleExport = useCallback(async () => {
    if (!data?.total) return;
    setExporting(true);
    try {
      await staffService.exportPlatformCsv({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        reason: reasonFilter || undefined,
      });
      toast.success(`${data.total} user(s) exported`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }, [data, search, roleFilter, statusFilter, reasonFilter]);

  if (loading && !data) return <UsersSkeleton />;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Super Admin' }, { label: 'Users' }]} />
      <PageHeader
        title="Users"
        description="Every staff account across all organizations on the platform."
        actions={
          <>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create User
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} loading={exporting} disabled={!data?.total}>
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={reload}>
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </>
        }
      />
      <UsersStats data={data} />
      <UsersToolbar
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        reasonFilter={reasonFilter}
        count={visibleData?.total ?? 0}
        onSearchChange={setSearch}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatusFilter}
        onReasonChange={setReasonFilter}
      />
      <UsersTable
        loading={loading}
        data={visibleData}
        pageItems={visibleItems}
        totalCount={visibleData?.total ?? 0}
        page={page}
        totalPages={visibleTotalPages}
        currentUserId={currentUser?.id}
        onToggleBlock={confirmUnblock}
        onOpenBlock={setBlockTarget}
        onView={setViewUser}
        onPageChange={setPage}
        onResetFilters={resetFilters}
      />
      <BlockReasonDialog
        open={blockTarget !== null}
        title="Block staff account"
        message={blockTarget ? `Blocking ${blockTarget.name} (${blockTarget.role}) will immediately lock them out of the portal.` : ''}
        loading={busy}
        onConfirm={confirmBlock}
        onCancel={() => setBlockTarget(null)}
      />
      <UserProfileModal user={viewUser} onClose={() => setViewUser(null)} />
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
    </div>
  );
}
