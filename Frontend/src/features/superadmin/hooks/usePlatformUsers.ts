import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { staffService, type PlatformUserDirectory } from '@/lib/api/staffService';
import { useDebouncedValue } from '@/lib/utils/useDebouncedValue';

export const USERS_PAGE_SIZE = 10;

export function usePlatformUsers() {
  const [data, setData] = useState<PlatformUserDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter, reasonFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await staffService.getAllPlatform({
        page,
        pageSize: USERS_PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        reason: reasonFilter || undefined,
      }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter, reasonFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setReasonFilter('');
    setPage(1);
  }, []);

  return {
    data, setData, loading, search, setSearch,
    roleFilter, setRoleFilter, statusFilter, setStatusFilter, reasonFilter, setReasonFilter,
    page, setPage, reload: load, resetFilters,
  };
}
