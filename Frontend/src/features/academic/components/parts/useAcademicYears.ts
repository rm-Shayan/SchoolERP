'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService } from '@/lib/api';
import type { AcademicYear } from '@/types';
import type { Term } from '@/lib/api/academicService';
import toast from 'react-hot-toast';

export interface YearFormValues { name: string; startDate: string; endDate: string; }

/** ISO datetime → YYYY-MM-DD for <input type="date">. */
export const toDateInput = (iso: string) => iso.slice(0, 10);

export function useAcademicYears() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [termsByYear, setTermsByYear] = useState<Record<string, Term[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      // Backend listAcademicYearsBySchool terms nested include karta hai — ek hi request
      const data = await academicService.getYearsBySchool(schoolId);
      setYears(data);
      const terms: Record<string, Term[]> = {};
      for (const y of data) terms[y.id] = y.terms ?? [];
      setTermsByYear(terms);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load academic years');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);  useEffect(() => { load(); }, [load]);

  // ── Optimistic local-state helpers (no full reload) ──────────
  const applyYear = (y: AcademicYear) =>
    setYears((prev) => {
      const idx = prev.findIndex((p) => p.id === y.id);
      if (idx === -1) return [y, ...prev].sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate));
      const next = [...prev];
      next[idx] = { ...next[idx], ...y };
      return next;
    });
  const removeYear = (id: string) => {
    setYears((prev) => prev.filter((y) => y.id !== id));
    setTermsByYear((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  const applyTerm = (t: Term) =>
    setTermsByYear((prev) => ({
      ...prev,
      [t.academicYearId]: [...(prev[t.academicYearId] ?? []).filter((x) => x.id !== t.id), t].sort(
        (a, b) => +new Date(a.startDate) - +new Date(b.startDate)
      ),
    }));
  const removeTerm = (id: string) =>
    setTermsByYear((prev) => {
      const yid = Object.keys(prev).find((k) => (prev[k] ?? []).some((t) => t.id === id));
      return yid ? { ...prev, [yid]: (prev[yid] ?? []).filter((t) => t.id !== id) } : prev;
    });

  const fail = (msg: string) => (e: any) => {
    toast.error(e?.response?.data?.message ?? msg);
    load();
  };

  const createYear = async (v: YearFormValues) => {
    if (!schoolId) return;
    try {
      applyYear({ ...(await academicService.createYear(schoolId, v)), terms: [] });
      setShowForm(false);
      toast.success('Academic year created');
    } catch (e: any) {
      fail('Failed to create year')(e);
    }
  };

  const updateYear = async (v: YearFormValues) => {
    if (!editingYear) return;
    applyYear({ ...editingYear, ...v });
    try {
      applyYear(await academicService.updateYear(editingYear.id, v));
      setEditingYear(null);
      toast.success('Academic year updated');
    } catch (e: any) {
      fail('Failed to update year')(e);
    }
  };

  const deleteYear = async (year: AcademicYear) => {
    if (!confirm(`Delete academic year "${year.name}"? Its terms will also be removed.`)) return;
    removeYear(year.id);
    try {
      await academicService.deleteYear(year.id);
      toast.success('Academic year deleted');
    } catch (e: any) {
      fail('Failed to delete year')(e);
    }
  };

  const toggleCurrent = async (year: AcademicYear) => {
    setYears((prev) => prev.map((y) => ({ ...y, isCurrent: y.id === year.id })));
    try {
      await academicService.updateYear(year.id, { isCurrent: !year.isCurrent });
    } catch (e: any) {
      fail('Failed to update year')(e);
    }
  };

  const createTerm = async (yearId: string, v: YearFormValues) => {
    try {
      applyTerm(await academicService.createTerm(yearId, v));
      toast.success('Term created');
    } catch (e: any) {
      fail('Failed to create term')(e);
    }
  };

  const updateTerm = async (id: string, v: YearFormValues) => {
    try {
      applyTerm(await academicService.updateTerm(id, v));
      toast.success('Term updated');
    } catch (e: any) {
      fail('Failed to update term')(e);
    }
  };

  const deleteTerm = async (id: string, name: string) => {
    if (!confirm(`Delete term "${name}"?`)) return;
    removeTerm(id);
    try {
      await academicService.deleteTerm(id);
      toast.success('Term deleted');
    } catch (e: any) {
      fail('Failed to delete term')(e);
    }
  };

  return { years, termsByYear, loading, showForm, editingYear, setShowForm, setEditingYear, createYear, updateYear, deleteYear, toggleCurrent, createTerm, updateTerm, deleteTerm };
}
