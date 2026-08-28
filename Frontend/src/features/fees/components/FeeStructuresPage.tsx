'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { feeService, academicService } from '@/lib/api';
import type { FeeStructure } from '@/types';
import { PageHeader, Button, Card, CardContent, EmptyState } from '@/features/shared/components';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import FeeStructureForm from './parts/FeeStructureForm';

export default function FeeStructuresPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [years, setYears] = useState<{ id: string; name: string }[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);

  const load = async () => {
    if (!schoolId) return;
    try {
      const [data, c, y] = await Promise.all([
        feeService.getStructuresBySchool(schoolId),
        academicService.getClassesBySchool(schoolId),
        academicService.getYearsBySchool(schoolId),
      ]);
      setStructures(data); setClasses(c); setYears(y);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to load fee structures'); }
    finally { setMetaLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [schoolId]);

  const remove = async (id: string) => {
    if (!confirm('Delete this fee structure?')) return;
    try { await feeService.deleteStructure(id); toast.success('Structure deleted'); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to delete structure'); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Fee Structures" description="Define year-aware fee structures per class."
        actions={<Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-200/50 !border-0">+ New Structure</Button>} />

      <FeeStructureForm key={editing?.id ?? 'new'} open={showForm} schoolId={schoolId ?? ''}
        classes={classes} years={years} metaLoading={metaLoading} structure={editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={() => { setShowForm(false); setEditing(null); load(); }} />

      {structures.length === 0 ? (
        <Card>
          <EmptyState title="No fee structures yet"
            description="Create your first fee structure to define tuition, transport and other charges per class."
            action={<Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>+ Create First Structure</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {structures.map((s) => {
            const total = (s.lineItems ?? []).reduce((sum, li) => sum + Number(li.amount), 0);
            const itemCount = (s.lineItems ?? []).length;
            const hasLateFee = (s.lineItems ?? []).some((li) => li.isLateFee);
            return (
              <Card key={s.id} className="flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200/60 group">
                {/* Glassmorphism Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 px-5 py-5">
                  <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                  <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-white/5 blur-lg" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white truncate text-[15px]">{s.name}</h3>
                      <p className="text-[11px] text-white/50 mt-1 font-medium">
                        {(s.classes?.[0]?.name) ?? 'All classes'}
                        {s.academicYearId ? ' · Year linked' : ''}
                      </p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 ring-1 ring-white/20">
                      <span className="text-white font-extrabold text-sm tabular-nums">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <CardContent className="flex-1 px-5 py-4 space-y-1">
                  {(s.lineItems ?? []).map((li) => (
                    <div key={li.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0 group/item">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-300 shrink-0" />
                        <span className="text-gray-600 truncate group-hover/item:text-gray-900 transition-colors">{li.title}</span>
                        {li.isLateFee && (
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold rounded-full border border-rose-100">
                            Late Fee
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 whitespace-nowrap">{formatCurrency(li.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-medium">{itemCount} item{itemCount !== 1 ? 's' : ''}{hasLateFee ? ' · late fee active' : ''}</span>
                    <span className="text-sm font-extrabold text-primary-700">{formatCurrency(total)}</span>
                  </div>
                </CardContent>

                {/* Actions */}
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(s); setShowForm(true); }}
                    className="!border-gray-200 hover:!border-primary-300">Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(s.id)}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
