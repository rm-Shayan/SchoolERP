'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService, type SectionTemplate } from '@/lib/api/academicService';
import { Card, CardContent, Button, Badge, EmptyState, GridCardsSkeleton } from '@/features/shared/components';
import SectionTemplateForm from './parts/SectionTemplateForm';
import toast from 'react-hot-toast';

export default function SectionsSection() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [templates, setTemplates] = useState<SectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SectionTemplate | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      setTemplates(await academicService.getSectionTemplates(schoolId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic local-state updates — no full reload after each action
  const submit = async (v: { name: string }) => {
    if (!schoolId) return;
    try {
      if (editing) {
        const updated = await academicService.updateSectionTemplate(editing.id, v);
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditing(null);
        toast.success('Section updated');
      } else {
        const created = await academicService.createSectionTemplate(schoolId, v);
        setTemplates((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setShowForm(false);
        toast.success('Section added to school');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save section');
    }
  };

  const remove = async (t: SectionTemplate) => {
    if (!confirm(`Remove section "${t.name}" from the school pool?`)) return;
    const prev = templates;
    setTemplates((p) => p.filter((x) => x.id !== t.id));
    try {
      await academicService.deleteSectionTemplate(t.id);
      toast.success('Section removed');
    } catch (err: any) {
      setTemplates(prev); // rollback
      toast.error(err?.response?.data?.message ?? 'Failed to remove section');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-primary-50/60 border-primary-100">
        <CardContent className="text-sm text-gray-700 py-3">
          These are your school's <strong>generic section names</strong> (e.g.{' '}
          <Badge variant="info">A</Badge> <Badge variant="info">B</Badge>{' '}
          <Badge variant="info">Morning</Badge>). Create them here first — then you'll
          assign them when creating a class in the <strong>Classes</strong> tab.
          <span className="block mt-1 text-xs text-gray-500">
            Capacity/room aren't set here — each class-section combination has its own
            capacity set in the Classes tab (e.g. Class 4 + A = 50, Class 5 + A = 35).
          </span>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>Add Section</Button>
      </div>

      {(showForm || editing) && (
        <SectionTemplateForm
          key={editing?.id ?? 'new'}
          initial={editing ? { name: editing.name } : undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={submit}
        />
      )}

      {loading ? (
        <GridCardsSkeleton count={4} cols={4} />
      ) : templates.length === 0 ? (
        <EmptyState icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} title="No sections yet" description="Create your school's section names first (e.g. A, B, Morning) — classes will use them." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-3">
                <span className="text-sm font-medium text-gray-900">{t.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditing(t); }}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(t)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
