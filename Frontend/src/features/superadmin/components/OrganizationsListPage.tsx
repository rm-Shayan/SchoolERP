'use client';

import { useCallback, useState } from 'react';
import { PageHeader, Button, ConfirmDialog, StatsCard, Pagination } from '@/features/shared/components';
import Skeleton from './parts/Skeleton';
import Breadcrumbs from './parts/Breadcrumbs';
import StatusFilterChips from './parts/StatusFilterChips';
import OrgsSearch from './parts/OrgsSearch';
import OrgsGrid from './parts/OrgsGrid';
import OrganizationsTable from './parts/OrganizationsTable';
import BlockReasonDialog from './parts/BlockReasonDialog';
import CreateOrganization from './CreateOrganization';
import OrgsToolbar from './parts/OrgsToolbar';
import { useOrganizationsPage, ORGS_PAGE_SIZE, type OrgViewMode } from './parts/useOrganizationsPage';

export default function OrganizationsListPage() {
  const {
    overview,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    view,
    setView,
    filtered,
    pageItems,
    totalPages,
    page,
    setPage,
    chipOptions,
    exporting,
    handleExport,
    blockTarget,
    setBlockTarget,
    unblockTarget,
    setUnblockTarget,
    busy,
    confirmBlock,
    confirmUnblock,
    reload,
  } = useOrganizationsPage();
  const [createOpen, setCreateOpen] = useState(false);

  const setMode = useCallback(
    (mode: OrgViewMode) => setView(mode),
    [setView]
  );
  if (loading) return <Skeleton />;
  const stats = overview?.stats;

  return (
    <div className="space-y-7">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Organizations' }]} />
      <PageHeader
        title="Organizations"
        description="Manage all tenant organizations and their branches."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {(['grid', 'table'] as OrgViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMode(mode)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition-colors ${
                    view === mode ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <OrgsToolbar exporting={exporting} onExport={handleExport} onCreate={() => setCreateOpen(true)} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard title="Organizations" value={stats?.totalOrganizations ?? 0} icon={OrgIcon} tint="bg-primary-50 text-primary-700" />
        <StatsCard title="Branches" value={stats?.totalSchools ?? 0} icon={BranchIcon} tint="bg-sky-50 text-sky-700" />
        <StatsCard title="Students" value={stats?.totalStudents ?? 0} icon={StudentIcon} tint="bg-emerald-50 text-emerald-700" />
        <StatsCard title="Total Revenue" value={fmtRev(stats?.totalRevenue ?? 0)} icon={RevenueIcon} tint="bg-amber-50 text-amber-700" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <StatusFilterChips options={chipOptions} value={statusFilter} onChange={setStatusFilter} />
        <OrgsSearch value={search} onChange={setSearch} />
      </div>

      {view === 'grid' ? (
        <OrgsGrid orgs={pageItems} search={search} blocking={busy} onBlock={setBlockTarget} onUnblock={setUnblockTarget} />
      ) : (
        <OrganizationsTable orgs={pageItems} search={search} blocking={busy} onBlock={setBlockTarget} onUnblock={setUnblockTarget} />
      )}

      <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={ORGS_PAGE_SIZE} onPageChange={setPage} />

      <BlockReasonDialog
        open={blockTarget !== null}
        title="Block organization"
        message={blockTarget ? `Blocking ${blockTarget.name} will lock out every branch, admin, staff, student, and parent.` : ''}
        loading={busy}
        onConfirm={confirmBlock}
        onCancel={() => setBlockTarget(null)}
      />
      <ConfirmDialog
        open={unblockTarget !== null}
        title="Unblock organization"
        message={unblockTarget ? `Restore access for ${unblockTarget.name} and all its branches?` : ''}
        confirmLabel="Unblock"
        variant="primary"
        loading={busy}
        onConfirm={confirmUnblock}
        onCancel={() => setUnblockTarget(null)}
      />
      <CreateOrganization open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
    </div>
  );
}

const OrgIcon = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const BranchIcon = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const StudentIcon = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const RevenueIcon = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const fmtRev = (n: number) => `Rs ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
