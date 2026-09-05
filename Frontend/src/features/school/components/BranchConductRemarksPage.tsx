'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { conductService, staffService } from '@/lib/api';
import type { ConductRemark } from '@/lib/api/conductService';
import type { User } from '@/types';
import { PageHeader, Button, Card, CardContent, Select, Pagination, ConfirmDialog } from '@/features/shared/components';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import RemarkForm from '@/features/teacher/components/parts/RemarkForm';
import OrgConductRemarkList from './parts/OrgConductRemarkList';
import toast from 'react-hot-toast';

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
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ConductRemark | null>(null);
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

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (r: ConductRemark) => { setEditing(r); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={editing ? 'Edit Remark' : 'Conduct Remarks'}
          description={editing ? 'Update the remark below.' : 'Record conduct remarks — yourself or on behalf of a teacher.'} />
        {!showForm && (
          <Button onClick={openNew} className="shrink-0">
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Remark
          </Button>
        )}
      </div>

      {showForm && (
        <RemarkForm editing={editing} onSaved={() => { closeForm(); load(); }} onCancel={closeForm} />
      )}

      <div className="grid max-w-md grid-cols-3 gap-3">
        <Card className="p-3 text-center"><p className="text-lg font-bold text-gray-900">{total}</p><p className="text-[11px] text-gray-400">Total</p></Card>
        <Card className="p-3 text-center"><p className="text-lg font-bold text-emerald-600">{stats.positive}</p><p className="text-[11px] text-gray-400">Positive</p></Card>
        <Card className="p-3 text-center"><p className="text-lg font-bold text-red-600">{stats.negative}</p><p className="text-[11px] text-gray-400">Negative</p></Card>
      </div>

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

      {loading ? (
        <Card><CardContent><div className="animate-pulse space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100" />)}</div></CardContent></Card>
      ) : (
        <>
          <OrgConductRemarkList remarks={remarks} onEdit={openEdit} onDelete={setDeleting} />
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={total} pageSize={20} onPageChange={setPage} />}
        </>
      )}

      <ConfirmDialog open={Boolean(deleting)} title="Delete remark?" message={`"${deleting?.comment}" permanently delete ho jayega.`}
        confirmLabel="Delete" loading={deleteBusy} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
