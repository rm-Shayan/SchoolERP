'use client';

import { useCallback, useEffect, useState } from 'react';
import { conductService } from '@/lib/api';
import type { ConductRemark } from '@/lib/api/conductService';
import { PageHeader, Button, Card, EmptyState, ConfirmDialog, Pagination } from '@/features/shared/components';
import RemarkForm from '@/features/teacher/components/parts/RemarkForm';
import toast from 'react-hot-toast';

const TYPE_BADGE: Record<string, string> = {
  POSITIVE: 'bg-emerald-50 text-emerald-700',
  NEUTRAL: 'bg-gray-100 text-gray-600',
  NEGATIVE: 'bg-red-50 text-red-700',
};

export default function StaffConductRemarksPage() {
  const [remarks, setRemarks] = useState<ConductRemark[]>([]);
  const [remarkTotal, setRemarkTotal] = useState(0);
  const [remarkPage, setRemarkPage] = useState(1);
  const [editing, setEditing] = useState<ConductRemark | null>(null);
  const [deleting, setDeleting] = useState<ConductRemark | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadRemarks = useCallback(async () => {
    try {
      const res = await conductService.getMine({ page: remarkPage, pageSize: 20 });
      setRemarks(res.items);
      setRemarkTotal(res.total);
    } catch { /* noop */ }
  }, [remarkPage]);

  useEffect(() => { loadRemarks(); }, [loadRemarks]);

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await conductService.remove(deleting.id);
      toast.success('Remark deleted');
      setDeleting(null);
      loadRemarks();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete');
    } finally { setDeleteBusy(false); }
  };

  const totalPages = Math.ceil(remarkTotal / 20);

  return (
    <div className="space-y-6">
      <PageHeader title={editing ? 'Edit Remark' : 'Conduct Remarks'}
        description={editing ? 'Update the remark below.' : 'Quick behaviour note — record student conduct for parents.'} />

      <RemarkForm editing={editing} onSaved={() => { setEditing(null); loadRemarks(); }} onCancel={() => setEditing(null)} />

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Remarks History ({remarkTotal})</h3>
        {remarks.length === 0 ? (
          <Card><EmptyState title="No remarks yet" description="Records will appear here." /></Card>
        ) : (
          <div className="space-y-2">
            {remarks.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_BADGE[r.type] ?? TYPE_BADGE.NEUTRAL}`}>{r.type}</span>
                      <span className="text-xs text-gray-400">
                        {r.student?.firstName} {r.student?.lastName}
                        {r.student?.section?.class?.name ? ` — ${r.student.section.class.name} ${r.student.section.name}` : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{r.comment}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50" title="Edit">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleting(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button size="sm" variant="ghost" disabled={remarkPage <= 1} onClick={() => setRemarkPage((p) => p - 1)}>← Prev</Button>
            <span className="text-xs text-gray-400 self-center">Page {remarkPage} of {totalPages}</span>
            <Button size="sm" variant="ghost" disabled={remarkPage >= totalPages} onClick={() => setRemarkPage((p) => p + 1)}>Next →</Button>
          </div>
        )}
      </div>

      <ConfirmDialog open={Boolean(deleting)} title="Delete remark?" message={`"${deleting?.comment}" permanently delete ho jayega.`}
        confirmLabel="Delete" loading={deleteBusy} onConfirm={handleDeleteConfirm} onCancel={() => setDeleting(null)} />
    </div>
  );
}