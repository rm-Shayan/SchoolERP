'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { orgService, moderationService } from '@/lib/api';
import type { OrganizationOverviewItem, PlatformOverview } from '@/types';
import { downloadBlob } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';

const errMsg = (err: any, fallback: string) => err?.response?.data?.message || err?.message || fallback;

export type OrgViewMode = 'grid' | 'table';

export const ORGS_PAGE_SIZE = 12;

export function useOrganizationsPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<OrgViewMode>('grid');
  const [exporting, setExporting] = useState(false);
  const [blockTarget, setBlockTarget] = useState<OrganizationOverviewItem | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<OrganizationOverviewItem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setOverview(await orgService.getOverview());
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: org created / delivered on login / blocked / unblocked / imported —
  // overview_updated event triggers a live list refresh (Delivered pill updates).
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = () => load();
    socket.on('overview_updated', onUpdate);
    socket.on('import_completed', onUpdate);
    return () => { socket.off('overview_updated', onUpdate); socket.off('import_completed', onUpdate); };
  }, [load]);

  const allOrgs = useMemo(() => overview?.organizations ?? [], [overview]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allOrgs.filter((o) => {
      const matchSearch =
        !q || o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q);
      const matchStatus = !statusFilter || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allOrgs, search, statusFilter]);

  // Search/filter changed → reset to page 1
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / ORGS_PAGE_SIZE)),
    [filtered.length]
  );
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * ORGS_PAGE_SIZE, page * ORGS_PAGE_SIZE),
    [filtered, page]
  );

  const chipOptions = useMemo(
    () => [
      { value: 'ACTIVE', label: 'Delivered', count: allOrgs.filter((o) => o.status === 'ACTIVE').length },
      { value: 'BLOCKED', label: 'Blocked', count: allOrgs.filter((o) => o.status === 'BLOCKED').length },
      { value: 'PARTIALLY_BLOCKED', label: 'Partially Blocked', count: allOrgs.filter((o) => o.status === 'PARTIALLY_BLOCKED').length },
      { value: 'SETUP_PENDING', label: 'Not delivered', count: allOrgs.filter((o) => o.status === 'SETUP_PENDING').length },
    ],
    [allOrgs]
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await orgService.exportExcel();
      downloadBlob(blob, `organizations-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Organizations exported');
    } catch (err: any) {
      toast.error(errMsg(err, 'Export failed'));
    } finally {
      setExporting(false);
    }
  }, []);

  const confirmBlock = useCallback(async (reason: string) => {
    if (!blockTarget) return;
    setBusy(true);
    try {
      await moderationService.blockOrganization(blockTarget.id, reason);
      toast.success(`${blockTarget.name} blocked`);
      setBlockTarget(null);
      await load();
    } catch (err: any) { toast.error(errMsg(err, 'Failed to block organization')); }
    finally { setBusy(false); }
  }, [blockTarget, load]);

  const confirmUnblock = useCallback(async () => {
    if (!unblockTarget) return;
    setBusy(true);
    try {
      await moderationService.unblockOrganization(unblockTarget.id);
      toast.success(`${unblockTarget.name} unblocked`);
      setUnblockTarget(null);
      await load();
    } catch (err: any) { toast.error(errMsg(err, 'Failed to unblock organization')); }
    finally { setBusy(false); }
  }, [unblockTarget, load]);

  return {
    overview, loading, search, setSearch, statusFilter, setStatusFilter,
    page, setPage, totalPages, pageItems, view, setView, filtered, chipOptions,
    exporting, handleExport, blockTarget, setBlockTarget, unblockTarget, setUnblockTarget,
    busy, confirmBlock, confirmUnblock, reload: load,
  };
}
