'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { conductService, academicService } from '@/lib/api';
import type { ConductRemark } from '@/lib/api/conductService';
import type { AcademicYear } from '@/types';
import { PageHeader, Card, CardContent, EmptyState, Badge } from '@/features/shared/components';
import { ListSkeleton } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const TYPE_BADGE: Record<string, 'success' | 'danger' | 'warning'> = {
  POSITIVE: 'success', NEGATIVE: 'danger', NEUTRAL: 'warning',
};

export default function RemarksHistoryPage() {
  const { school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id;
  const [items, setItems] = useState<ConductRemark[]>([]);
  const [total, setTotal] = useState(0);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    academicService.getYearsBySchool(schoolId).then((yrs: AcademicYear[]) => {
      setYears(yrs);
      const current = yrs.find((y: AcademicYear) => y.isCurrent);
      if (current) setYearId(current.id);
    }).catch(() => {});
  }, [schoolId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await conductService.getMine({ academicYearId: yearId || undefined, page, pageSize: 20 });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load remarks');
    } finally {
      setLoading(false);
    }
  }, [yearId, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 20)), [total]);

  const stats = useMemo(() => {
    const s = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
    items.forEach((r) => { s[r.type] = (s[r.type] ?? 0) + 1; });
    return s;
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Remarks History" description="Conduct remarks you've given, organized by academic year." />

      {/* Filters + stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <select
          value={yearId}
          onChange={(e) => { setYearId(e.target.value); setPage(1); }}
          className="text-sm border rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All academic years</option>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (Current)' : ''}</option>)}
        </select>
        <div className="flex gap-4">
          {[
            { label: 'Positive', value: stats.POSITIVE, cls: 'text-emerald-600' },
            { label: 'Neutral', value: stats.NEUTRAL, cls: 'text-amber-600' },
            { label: 'Negative', value: stats.NEGATIVE, cls: 'text-rose-600' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={cn('text-lg font-bold tabular-nums', s.cls)}>{s.value}</p>
              <p className="text-[10px] text-gray-400 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12"><EmptyState title="No remarks found" description={yearId ? 'No remarks for this academic year.' : 'You haven\'t given any remarks yet.'} /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-gray-100">
            {items.map((r) => (
              <div key={r.id} className="px-4 py-3.5 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {r.student?.firstName} {r.student?.lastName}
                      </p>
                      {r.student?.rollNumber && <span className="text-xs text-gray-400">#{r.student.rollNumber}</span>}
                      {r.student?.section && (
                        <span className="text-xs text-gray-400">
                          {r.student.section.class?.name} — {r.student.section.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                      {r.academicYear && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{r.academicYear.name}</span>}
                    </div>
                  </div>
                  <Badge variant={TYPE_BADGE[r.type] ?? 'default'}>{r.type}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Prev</button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
