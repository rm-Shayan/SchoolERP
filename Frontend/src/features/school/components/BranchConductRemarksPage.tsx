'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { conductService, staffService } from '@/lib/api';
import type { ConductRemark } from '@/lib/api/conductService';
import type { User } from '@/types';
import { PageHeader, Card, CardContent, EmptyState, Select, Button, Pagination, ConfirmDialog } from '@/features/shared/components';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import toast from 'react-hot-toast';

const TYPE_BADGE: Record<string, string> = {
  POSITIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  NEUTRAL: 'bg-gray-100 text-gray-600',
  NEGATIVE: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
};

const TYPE_FILTERS = [
  { value: '', label: 'All Types' },
  { value: 'POSITIVE', label: 'Positive' },
  { value: 'NEUTRAL', label: 'Neutral' },
  { value: 'NEGATIVE', label: 'Negative' },
];

export default function BranchConductRemarksPage() {
  const { school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id;
  const [remarks, setRemarks] = useState<ConductRemark[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<ConductRemark | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      if (typeFilter) params.type = typeFilter;
      if (teacherFilter) params.teacherId = teacherFilter;
      const res = await conductService.listAll(params);
      setRemarks(res.items);
      setTotal(res.total);
    } catch { toast.error('Failed to load remarks'); }
    finally { setLoading(false); }
  }, [page, typeFilter, teacherFilter]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['conduct_remark'], load);

  useEffect(() => {
    if (!schoolId) return;
    staffService.getAll({ schoolId, role: 'TEACHER', pageSize: 200 }).then((res) => setTeachers(res.items)).catch(() => {});
  }, [schoolId]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try { await conductService.remove(deleting.id); toast.success('Remark deleted'); setDeleting(null); load(); }
    catch { toast.error('Failed to delete'); }
    finally { setDeleteBusy(false); }
  };

  const stats = useMemo(() => {
    const pos = remarks.filter((r) => r.type === 'POSITIVE').length;
    const neg = remarks.filter((r) => r.type === 'NEGATIVE').length;
    return { positive: pos, negative: neg, total };
  }, [remarks, total]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <PageHeader title="Conduct Remarks" description={`All teacher remarks across the school (${total} total).`} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 max-w-md">
        <Card className="p-3 text-center"><p className="text-lg font-bold text-gray-900">{total}</p><p className="text-[11px] text-gray-400">Total</p></Card>
        <Card className="p-3 text-center"><p className="text-lg font-bold text-emerald-600">{stats.positive}</p><p className="text-[11px] text-gray-400">Positive</p></Card>
        <Card className="p-3 text-center"><p className="text-lg font-bold text-red-600">{stats.negative}</p><p className="text-[11px] text-gray-400">Negative</p></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select options={TYPE_FILTERS} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} />
        </div>
        <div className="w-48">
          <Select
            options={[{ value: '', label: 'All Teachers' }, ...teachers.map((t) => ({ value: t.id, label: t.name }))]}
            value={teacherFilter} onChange={(e) => { setTeacherFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <Card><CardContent><div className="animate-pulse space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div></CardContent></Card>
      ) : remarks.length === 0 ? (
        <Card><EmptyState title="No remarks found" description="No conduct remarks match your filters." /></Card>
      ) : (
        <>
          <div className="space-y-2">
            {remarks.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[r.type] ?? TYPE_BADGE.NEUTRAL}`}>{r.type}</span>
                      <span className="text-xs font-medium text-gray-700">
                        {r.student?.firstName} {r.student?.lastName}
                        {r.student?.section?.class?.name ? ` — ${r.student.section.class.name} ${r.student.section.name}` : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{r.comment}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-gray-400">by {r.teacher?.name ?? 'Unknown'}</span>
                      <span className="text-[11px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <button onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0" title="Delete">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={total} pageSize={20} onPageChange={setPage} />}
        </>
      )}

      <ConfirmDialog open={Boolean(deleting)} title="Delete remark?" message={`"${deleting?.comment}" permanently delete ho jayega.`}
        confirmLabel="Delete" loading={deleteBusy} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
