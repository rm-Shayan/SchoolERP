'use client';

import { useCallback, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import type { DirectoryItem } from '@/lib/api/staffService';
import { Button } from '@/features/shared/components';
import UsersStats from './parts/UsersStats';
import UsersToolbar from './parts/UsersToolbar';
import UsersTable from './parts/UsersTable';
import { UsersSkeleton } from './parts/UsersSkeleton';
import BlockReasonDialog from './parts/BlockReasonDialog';
import UserProfileModal from './parts/UserProfileModal';
import Breadcrumbs from './parts/Breadcrumbs';
import { useUserBlocking } from './parts/useUserBlocking';
import CreateUserModal from './parts/CreateUserModal';
import EditUserModal from './parts/EditUserModal';
import DeleteUserDialog from './parts/DeleteUserDialog';
import ResetPasswordDialog from './parts/ResetPasswordDialog';
import { usePlatformUsers } from '../hooks/usePlatformUsers';
import UnassignedAdminsBanner from './parts/UnassignedAdminsBanner';

const TABS = [
  { key: 'all', label: 'All Users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'staff', label: 'Staff', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'student', label: 'Students', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
];

export default function UsersPage() {
  const [viewTarget, setViewTarget] = useState<DirectoryItem | null>(null);
  const [editTarget, setEditTarget] = useState<DirectoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DirectoryItem | null>(null);
  const [resetTarget, setResetTarget] = useState<DirectoryItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data, setData, loading, search, setSearch,
    typeFilter, setTypeFilter,
    roleFilter, setRoleFilter, statusFilter, setStatusFilter,
    orgFilter, setOrgFilter, branchFilter, setBranchFilter,
    page, setPage, reload, resetFilters,
  } = usePlatformUsers();

  const { user: currentUser } = useAppSelector((s) => s.auth);
  const pageItems = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const { blockTarget, setBlockTarget, busy, confirmBlock, confirmUnblock } = useUserBlocking({ setData: setData as any, reload });

  const handleUpdated = useCallback(() => { setEditTarget(null); reload(); }, [reload]);
  const handleDeleted = useCallback(() => { setDeleteTarget(null); reload(); }, [reload]);

  if (loading && !data) return <UsersSkeleton />;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Super Admin' }, { label: 'Users' }]} />

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-600 p-5 text-white shadow-lg shadow-primary-600/15 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Users Management</h1>
              <p className="mt-1 text-sm text-white/75">Manage all staff, teachers, and students across every organization.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-white text-primary-700 hover:bg-primary-50 shadow-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create User
          </Button>
        </div>
      </div>

      {/* Tabs: All / Staff / Students */}
      <div className="flex gap-1 rounded-xl bg-gray-100/80 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTypeFilter(tab.key)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
              typeFilter === tab.key
                ? 'bg-white text-primary-700 shadow-sm ring-1 ring-primary-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      <UsersStats data={data} />
      <UnassignedAdminsBanner />
      <UsersToolbar
        search={search} typeFilter={typeFilter} roleFilter={roleFilter}
        statusFilter={statusFilter} orgFilter={orgFilter} branchFilter={branchFilter}
        count={total}
        onSearchChange={setSearch} onTypeChange={setTypeFilter}
        onRoleChange={setRoleFilter} onStatusChange={setStatusFilter}
        onOrgChange={setOrgFilter} onBranchChange={setBranchFilter}
      />
      <UsersTable
        loading={loading} data={data} pageItems={pageItems}
        totalCount={total} page={page} totalPages={totalPages}
        currentUserId={currentUser?.id}
        onToggleBlock={confirmUnblock} onOpenBlock={setBlockTarget}
        onView={setViewTarget} onEdit={setEditTarget}
        onDelete={setDeleteTarget} onResetPassword={setResetTarget}
        onPageChange={setPage} onResetFilters={resetFilters}
      />

      <BlockReasonDialog open={blockTarget !== null} title="Block account"
        message={blockTarget ? `Blocking ${blockTarget.name} will immediately lock them out.` : ''}
        loading={busy} onConfirm={confirmBlock} onCancel={() => setBlockTarget(null)} />
      <UserProfileModal user={viewTarget as any} onClose={() => setViewTarget(null)} />
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
      <EditUserModal user={editTarget as any} onClose={() => setEditTarget(null)} onUpdated={handleUpdated} />
      <DeleteUserDialog user={deleteTarget as any} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <ResetPasswordDialog user={resetTarget as any} onClose={() => setResetTarget(null)} />
    </div>
  );
}
