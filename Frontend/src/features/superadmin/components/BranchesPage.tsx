'use client';

import { Button, Card, ConfirmDialog, EmptyState, Input, Select, Pagination } from '@/features/shared/components';
import Breadcrumbs from './parts/Breadcrumbs';
import BranchesSkeleton from './parts/BranchesSkeleton';
import BranchesHeader from './parts/BranchesHeader';
import BranchesStats from './parts/BranchesStats';
import BranchesGrid from './parts/BranchesGrid';
import BranchesEmpty from './parts/BranchesEmpty';
import StatusFilterChips from './parts/StatusFilterChips';
import BlockReasonDialog from './parts/BlockReasonDialog';
import { useBranchesPage, BRANCHES_PAGE_SIZE } from './parts/useBranchesPage';

export default function BranchesPage() {
  const {
    schools,
    loading,
    loadError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    orgFilter,
    setOrgFilter,
    orgOptions,
    filtered,
    pageItems,
    totalPages,
    page,
    setPage,
    statusCounts,
    exporting,
    handleExport,
    deletingId,
    branchToDelete,
    setBranchToDelete,
    handleDeleteBranch,
    blockTarget,
    setBlockTarget,
    unblockTarget,
    setUnblockTarget,
    busy,
    confirmBlock,
    confirmUnblock,
    reload,
  } = useBranchesPage();

  if (loading) return <BranchesSkeleton />;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Branches' }]} />
      <BranchesHeader exporting={exporting} onExport={handleExport} />

      {loadError ? (
        <Card className="p-12">
          <EmptyState
            title="Failed to load branches"
            description="Something went wrong while loading branches. Please try again."
            action={<Button onClick={reload}>Retry</Button>}
          />
        </Card>
      ) : (
        <>
          <BranchesStats schools={schools} />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <StatusFilterChips
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ACTIVE', label: 'Active', count: statusCounts.active },
                { value: 'BLOCKED', label: 'Blocked', count: statusCounts.blocked },
              ]}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search name, code or org…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search branches"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                />
              </div>
              <div className="w-full sm:w-52">
                <Select
                  label="Organization"
                  value={orgFilter}
                  onChange={(e) => setOrgFilter(e.target.value)}
                  placeholder="All organizations"
                  options={orgOptions}
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <BranchesEmpty search={search} />
          ) : (
            <>
              <BranchesGrid
                schools={pageItems}
                deletingId={deletingId}
                onDelete={setBranchToDelete}
                onBlock={setBlockTarget}
                onUnblock={setUnblockTarget}
              />
              <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                pageSize={BRANCHES_PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}

      <BlockReasonDialog
        open={blockTarget !== null}
        title="Block branch"
        message={blockTarget ? `Blocking ${blockTarget.name} will lock out its admin, staff, students, and parents.` : ''}
        loading={busy}
        onConfirm={confirmBlock}
        onCancel={() => setBlockTarget(null)}
      />
      <ConfirmDialog
        open={unblockTarget !== null}
        title="Unblock branch"
        message={unblockTarget ? `Restore access for ${unblockTarget.name}?` : ''}
        confirmLabel="Unblock"
        variant="primary"
        loading={busy}
        onConfirm={confirmUnblock}
        onCancel={() => setUnblockTarget(null)}
      />
      <ConfirmDialog
        open={branchToDelete !== null}
        title="Delete branch"
        message={branchToDelete ? `This permanently removes "${branchToDelete.name}" and all its data.` : ''}
        confirmLabel="Delete"
        loading={deletingId === branchToDelete?.id}
        onConfirm={handleDeleteBranch}
        onCancel={() => setBranchToDelete(null)}
      />
    </div>
  );
}
