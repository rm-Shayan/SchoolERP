'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { schoolService, moderationService } from '@/lib/api';
import { downloadBlob } from '@/lib/utils';
import { dedupRequest } from '@/lib/utils/requestDedup';
import type { School } from '@/types';
import toast from 'react-hot-toast';

const errMsg = (err: any, fallback: string) => err?.response?.data?.message || err?.message || fallback;

export const BRANCHES_PAGE_SIZE = 12;

export function useBranchesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<School | null>(null);
  const [blockTarget, setBlockTarget] = useState<School | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<School | null>(null);
  const [busy, setBusy] = useState(false);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setSchools(await schoolService.getAll());
    } catch (err) {
      console.error('Failed to load branches:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const orgOptions = useMemo(() => {
    const map = new Map<string, string>();
    schools.forEach((s) => {
      if (s.organizationId && s.organization?.name) map.set(s.organizationId, s.organization.name);
    });
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [schools]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.organization?.name ?? '').toLowerCase().includes(q);
      const matchStatus = !statusFilter || s.status === statusFilter;
      const matchOrg = !orgFilter || s.organizationId === orgFilter;
      return matchSearch && matchStatus && matchOrg;
    });
  }, [schools, search, statusFilter, orgFilter]);

  // Search/filter badle → wapas page 1 se; filtered pehle se memoized hai
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, orgFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / BRANCHES_PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * BRANCHES_PAGE_SIZE, page * BRANCHES_PAGE_SIZE);

  const statusCounts = useMemo(
    () => ({
      active: schools.filter((s) => s.status === 'ACTIVE').length,
      blocked: schools.filter((s) => s.status === 'BLOCKED').length,
    }),
    [schools]
  );

  const handleDeleteBranch = useCallback(async () => {
    if (!branchToDelete) return;
    setDeletingId(branchToDelete.id);
    try {
      await dedupRequest(`delete-branch-${branchToDelete.id}`, () => schoolService.remove(branchToDelete.id));
      setSchools((prev) => prev.filter((s) => s.id !== branchToDelete.id));
      toast.success('Branch deleted');
      setBranchToDelete(null);
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to delete branch'));
    } finally {
      setDeletingId(null);
    }
  }, [branchToDelete]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await schoolService.exportExcel();
      downloadBlob(blob, `branches-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Branches exported');
    } catch (err: any) {
      toast.error(errMsg(err, 'Export failed'));
    } finally {
      setExporting(false);
    }
  }, []);

  const confirmBlock = useCallback(
    async (reason: string) => {
      if (!blockTarget) return;
      setBusy(true);
      try {
        await moderationService.blockSchool(blockTarget.id, reason);
        toast.success(`${blockTarget.name} blocked`);
        setBlockTarget(null);
        await loadBranches();
      } catch (err: any) {
        toast.error(errMsg(err, 'Failed to block branch'));
      } finally {
        setBusy(false);
      }
    },
    [blockTarget, loadBranches]
  );

  const confirmUnblock = useCallback(async () => {
    if (!unblockTarget) return;
    setBusy(true);
    try {
      await moderationService.unblockSchool(unblockTarget.id);
      toast.success(`${unblockTarget.name} unblocked`);
      setUnblockTarget(null);
      await loadBranches();
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to unblock branch'));
    } finally {
      setBusy(false);
    }
  }, [unblockTarget, loadBranches]);

  return {
    schools, loading, loadError, search, setSearch, statusFilter, setStatusFilter,
    orgFilter, setOrgFilter, orgOptions, filtered, pageItems, totalPages, page, setPage,
    statusCounts, exporting, handleExport, deletingId, branchToDelete, setBranchToDelete,
    handleDeleteBranch, blockTarget, setBlockTarget, unblockTarget, setUnblockTarget,
    busy, confirmBlock, confirmUnblock, reload: loadBranches,
  };
}
