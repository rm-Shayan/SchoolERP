'use client';

import { useCallback, useState } from 'react';
import { Button, Card, ConfirmDialog, EmptyState, Pagination } from '@/features/shared/components';
import Breadcrumbs from './parts/Breadcrumbs';
import BranchesSkeleton from './parts/BranchesSkeleton';
import BranchesGrid from './parts/BranchesGrid';
import BranchesEmpty from './parts/BranchesEmpty';
import BlockReasonDialog from './parts/BlockReasonDialog';
import AddBranchModal from './parts/AddBranchModal';
import EditBranchModal from './parts/EditBranchModal';
import BranchLeaderboard from './parts/BranchLeaderboard';
import BranchAnalytics from './parts/BranchAnalytics';
import { useBranchesPage, BRANCHES_PAGE_SIZE } from './parts/useBranchesPage';
import { cn } from '@/lib/utils';

export default function BranchesPage() {
  const {
    schools, loading, loadError, search, setSearch, statusFilter, setStatusFilter,
    orgFilter, setOrgFilter, orgOptions, filtered, pageItems, totalPages, page, setPage,
    statusCounts, exporting, handleExport, deletingId, branchToDelete, setBranchToDelete,
    handleDeleteBranch, blockTarget, setBlockTarget, unblockTarget, setUnblockTarget,
    busy, confirmBlock, confirmUnblock, reload,
    addModalOpen, setAddModalOpen, editTarget, setEditTarget,
    handleCreateBranch, handleUpdateBranch,
  } = useBranchesPage();

  if (loading) return <BranchesSkeleton />;

  const totalStudents = schools.reduce((s, sc) => s + (sc._count?.students ?? 0), 0);
  const totalStaff = schools.reduce((s, sc) => s + (sc._count?.users ?? 0), 0);
  const totalOrgs = new Set(schools.map((s) => s.organizationId).filter(Boolean)).size;

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Branches' }]} />

      {/* Hero header */}
      <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-violet-600 via-primary-600 to-indigo-600 px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">Branches</h1>
              <p className="mt-1 text-sm text-violet-100">Every campus across all organizations.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="bg-white/15 border-white/20 text-white hover:bg-white/25 hover:text-white backdrop-blur-sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Export
              </Button>
              <Button size="sm" onClick={() => setAddModalOpen(true)}
                className="bg-white text-primary-700 hover:bg-primary-50 border-0 shadow-sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Branch
              </Button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-4">
          {[
            { l: 'Branches', v: schools.length, c: 'text-primary-600 bg-primary-50', i: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6' },
            { l: 'Organizations', v: totalOrgs, c: 'text-sky-600 bg-sky-50', i: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5' },
            { l: 'Students', v: totalStudents, c: 'text-violet-600 bg-violet-50', i: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' },
            { l: 'Staff', v: totalStaff, c: 'text-amber-600 bg-amber-50', i: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          ].map((t) => (
            <div key={t.l} className="bg-white px-4 py-3 sm:px-5 sm:py-3.5">
              <div className="flex items-center gap-2">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', t.c)}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.i} /></svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t.l}</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">{t.v.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="px-5 py-3 sm:px-8 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search branches…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:bg-white focus:outline-none transition-all" />
          </div>
          <div className="flex items-center gap-2">
            {['ACTIVE', 'BLOCKED'].map((st) => (
              <button key={st} type="button" onClick={() => setStatusFilter(statusFilter === st ? '' : st)}
                className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  statusFilter === st ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                <span className={cn('w-1.5 h-1.5 rounded-full', st === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400')} />
                {st === 'ACTIVE' ? 'Active' : 'Blocked'} {st === 'ACTIVE' ? statusCounts.active : statusCounts.blocked}
              </button>
            ))}
            {orgOptions.length > 0 && (
              <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
                <option value="">All orgs</option>
                {orgOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {loadError ? (
        <Card className="p-12">
          <EmptyState title="Failed to load branches" description="Something went wrong." action={<Button onClick={reload}>Retry</Button>} />
        </Card>
      ) : (
        <>
          {filtered.length === 0 ? (
            <BranchesEmpty search={search} />
          ) : (
            <>
              <BranchesGrid schools={pageItems} deletingId={deletingId} onDelete={setBranchToDelete}
                onEdit={setEditTarget} onBlock={setBlockTarget} onUnblock={setUnblockTarget} />
              <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={BRANCHES_PAGE_SIZE} onPageChange={setPage} />
            </>
          )}

          {/* Analytics bottom section */}
          {schools.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <BranchLeaderboard title="Top by Students" schools={schools} field="studentCount"
                  hoverColor="hover:bg-violet-50/40" barColor="bg-gradient-to-r from-violet-400 to-violet-500" />
                <BranchLeaderboard title="Top by Staff" schools={schools} field="staffCount"
                  hoverColor="hover:bg-primary-50/40" barColor="bg-gradient-to-r from-primary-400 to-primary-500" />
              </div>
              <BranchAnalytics schools={schools} />
            </div>
          )}
        </>
      )}

      <BlockReasonDialog open={blockTarget !== null} title="Block branch" message={blockTarget ? `Blocking ${blockTarget.name} will lock out its admin, staff, students, and parents.` : ''} loading={busy} onConfirm={confirmBlock} onCancel={() => setBlockTarget(null)} />
      <ConfirmDialog open={unblockTarget !== null} title="Unblock branch" message={unblockTarget ? `Restore access for ${unblockTarget.name}?` : ''} confirmLabel="Unblock" variant="primary" loading={busy} onConfirm={confirmUnblock} onCancel={() => setUnblockTarget(null)} />
      <ConfirmDialog open={branchToDelete !== null} title="Delete branch" message={branchToDelete ? `This permanently removes "${branchToDelete.name}" and all its data.` : ''} confirmLabel="Delete" loading={deletingId === branchToDelete?.id} onConfirm={handleDeleteBranch} onCancel={() => setBranchToDelete(null)} />
      <AddBranchModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onCreate={handleCreateBranch} />
      <EditBranchModal open={editTarget !== null} school={editTarget} onClose={() => setEditTarget(null)} onUpdated={handleUpdateBranch} />
    </div>
  );
}
