import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { staffService, type PlatformDirectory } from '@/lib/api/staffService';
import { useDebouncedValue } from '@/lib/utils/useDebouncedValue';

export const USERS_PAGE_SIZE = 20;

export function usePlatformUsers() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const [data, setData] = useState<PlatformDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter, roleFilter, statusFilter, orgFilter, branchFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await staffService.getDirectory({
        page,
        pageSize: USERS_PAGE_SIZE,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: debouncedSearch.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        organizationId: orgFilter || undefined,
        schoolId: branchFilter || undefined,
      }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, roleFilter, statusFilter, orgFilter, branchFilter]);

  useEffect(() => { load(); }, [load]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setRoleFilter('');
    setStatusFilter('');
    setOrgFilter('');
    setBranchFilter('');
    setPage(1);
  }, []);

  return {
    data, setData, loading, search, setSearch,
    typeFilter, setTypeFilter,
    roleFilter, setRoleFilter,
    statusFilter, setStatusFilter,
    orgFilter, setOrgFilter,
    branchFilter, setBranchFilter,
    page, setPage, reload: load, resetFilters,
  };
}
