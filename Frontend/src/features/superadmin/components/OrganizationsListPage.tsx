'use client';

import { useCallback, useState } from 'react';
import { PageHeader, ConfirmDialog, Pagination, Button } from '@/features/shared/components';
import Skeleton from './parts/Skeleton';
import Breadcrumbs from './parts/Breadcrumbs';
import OrgsGrid from './parts/OrgsGrid';
import OrganizationsTable from './parts/OrganizationsTable';
import BlockReasonDialog from './parts/BlockReasonDialog';
import CreateOrganization from './CreateOrganization';
import OrgsStatsBar from './parts/OrgsStatsBar';
import OrgsBottomSection from './parts/OrgsBottomSection';
import { useOrganizationsPage, ORGS_PAGE_SIZE, type OrgViewMode } from './parts/useOrganizationsPage';

export default function OrganizationsListPage() {
  const {
    overview, loading, search, setSearch,
    view, setView, filtered, pageItems, totalPages, page, setPage,
    exporting, handleExport, blockTarget, setBlockTarget,
    unblockTarget, setUnblockTarget, busy, confirmBlock, confirmUnblock, reload,
  } = useOrganizationsPage();
  const [createOpen, setCreateOpen] = useState(false);

  const setMode = useCallback((mode: OrgViewMode) => setView(mode), [setView]);
  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Organizations' }]} />

      {/* Hero header */}
      <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 via-primary-600 to-indigo-600 px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">Organizations</h1>
              <p className="mt-1 text-sm text-violet-100">Manage all tenant organizations and their branches.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 rounded-lg bg-white/15 p-0.5 backdrop-blur-sm">
                {(['grid', 'table'] as OrgViewMode[]).map((mode) => (
                  <button key={mode} type="button" onClick={() => setMode(mode)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all ${view === mode ? 'bg-white text-violet-700 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                    {mode === 'grid' ? (
                      <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    )}
                    {mode}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleExport} loading={exporting}
                className="bg-white/15 border-white/20 text-white hover:bg-white/25 hover:text-white backdrop-blur-sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Export
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}
                className="bg-white text-violet-700 hover:bg-violet-50 border-0 shadow-sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Org
              </Button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <OrgsStatsBar stats={overview?.stats} />

        {/* Search */}
        <div className="px-5 py-3 sm:px-8 border-t border-gray-100">
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search organizations…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all" />
          </div>
        </div>
      </div>

      {/* Main content */}
      {view === 'grid' ? (
        <OrgsGrid orgs={pageItems} search={search} blocking={busy} onBlock={setBlockTarget} onUnblock={setUnblockTarget} />
      ) : (
        <OrganizationsTable orgs={pageItems} search={search} blocking={busy} onBlock={setBlockTarget} onUnblock={setUnblockTarget} />
      )}

      <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={ORGS_PAGE_SIZE} onPageChange={setPage} />

      {/* Bottom section */}
      <OrgsBottomSection overview={overview} />

      <BlockReasonDialog open={blockTarget !== null} title="Block organization"
        message={blockTarget ? `Blocking ${blockTarget.name} will lock out every branch, admin, staff, student, and parent.` : ''}
        loading={busy} onConfirm={confirmBlock} onCancel={() => setBlockTarget(null)} />
      <ConfirmDialog open={unblockTarget !== null} title="Unblock organization"
        message={unblockTarget ? `Restore access for ${unblockTarget.name} and all its branches?` : ''}
        confirmLabel="Unblock" variant="primary" loading={busy} onConfirm={confirmUnblock} onCancel={() => setUnblockTarget(null)} />
      <CreateOrganization open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
    </div>
  );
}
