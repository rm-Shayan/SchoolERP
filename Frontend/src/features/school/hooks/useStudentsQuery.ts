'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { studentService, type StudentSummary } from '@/lib/api/studentService';
import type { Student } from '@/types';
import { useDebouncedValue } from '../components/parts/helpers';

interface UseStudentsQueryResult {
  students: Student[];
  total: number;
  summary: StudentSummary | null;
  loading: boolean;
  refetching: boolean;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  sectionFilter: string;
  setSectionFilter: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
  pageSize: number;
  setPageSize: (v: number) => void;
  totalPages: number;
  reload: () => void;
  patchStudent: (updated: Student) => void;
  removeStudent: (id: string) => void;
  exportCsv: () => void;
}

export function useStudentsQuery(schoolId?: string): UseStudentsQueryResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  // Search/filter changes always restart from page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sectionFilter, pageSize]);

  const fetchPage = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    // First load shows the skeleton; later fetches keep the table visible
    // (stale-while-revalidate) so the UI never flickers to a blank spinner.
    if (!hasLoadedRef.current) setLoading(true);
    else setRefetching(true);
    try {
      const res = await studentService.getPage({
        schoolId,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        sectionId: sectionFilter || undefined,
        page,
        pageSize,
      });
      // Drop stale responses (filters changed mid-flight).
      if (requestId !== requestIdRef.current) return;
      setStudents(res.items);
      setTotal(res.total);
      if (res.summary) setSummary(res.summary);
    } catch {
      if (requestId === requestIdRef.current) setStudents([]);
    } finally {
      if (requestId === requestIdRef.current) {
        hasLoadedRef.current = true;
        setLoading(false);
        setRefetching(false);
      }
    }
  }, [schoolId, debouncedSearch, statusFilter, sectionFilter, page, pageSize]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Filter removed the last row on a page → step back one page.
  useEffect(() => {
    if (page > 1 && !loading && total > 0 && students.length === 0) {
      setPage((p) => p - 1);
    }
  }, [students, total, page, loading]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Local-state mutations so the list reflects edits/deletes instantly without
  // waiting on (or depending on) the server cache to invalidate. `reload()` still
  // runs afterwards to confirm authoritative data.
  const patchStudent = useCallback((updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
  }, []);

  const removeStudent = useCallback((id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  // Current filters ke saath CSV download (backend /students/export).
  const exportCsv = useCallback(() => {
    if (!schoolId) return;
    studentService.exportCsv({
      schoolId,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter || undefined,
      sectionId: sectionFilter || undefined,
    }).catch(() => {});
  }, [schoolId, debouncedSearch, statusFilter, sectionFilter]);

  return {
    students,
    total,
    summary,
    loading,
    refetching,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sectionFilter,
    setSectionFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    reload: fetchPage,
    patchStudent,
    removeStudent,
    exportCsv,
  };
}
