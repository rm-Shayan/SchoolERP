'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService, homeworkService } from '@/lib/api';
import type { Homework } from '@/lib/api/homeworkService';
import { PageHeader, Button, Card, Modal, EmptyState, CardGridSkeleton, ConfirmDialog } from '@/features/shared/components';
import HomeworkForm, { type SectionOption, type HomeworkFormValues } from './parts/HomeworkForm';
import HomeworkCard from './parts/HomeworkCard';
import toast from 'react-hot-toast';

export default function HomeworkPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [items, setItems] = useState<Homework[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const [deleting, setDeleting] = useState<Homework | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, classes] = await Promise.all([
        homeworkService.getAll(),
        academicService.getClassesBySchool(schoolId ?? ''),
      ]);
      setItems(list.items);
      const opts: SectionOption[] = [];
      for (const c of classes) {
        (c.sections ?? []).forEach((s) => opts.push({ id: s.id, label: `${c.name} — ${s.name}`, classId: c.id }));
      }
      setSections(opts);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load homework');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (values: HomeworkFormValues) => {
    try {
      const payload: any = { sectionId: values.sectionId, title: values.title, content: values.content };
      if (values.subjectIds?.length) payload.subjectIds = values.subjectIds;
      await homeworkService.create(payload);
      toast.success('Homework broadcast to parents');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to post homework');
    }
  };

  const handleUpdate = async (values: HomeworkFormValues) => {
    if (!editing) return;
    try {
      await homeworkService.update(editing.id, { title: values.title, content: values.content });
      toast.success('Homework updated');
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update homework');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await homeworkService.remove(deleting.id);
      toast.success('Homework deleted');
      setDeleting(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete homework');
    } finally {
      setDeletingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description="Post homework per section — parents get notified instantly."
        actions={<Button size="sm" onClick={() => setShowForm(true)}>New Homework</Button>}
      />

      {/* Create modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Post Homework">
        <HomeworkForm
          sections={sections}
          sectionsLoading={loading && sections.length === 0}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Homework">
        {editing && (
          <HomeworkForm
            sections={sections}
            initialValues={{
              sectionId: editing.sectionId,
              title: editing.title,
              content: editing.content,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete Homework"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deletingLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <Card><EmptyState title="No homework yet" description="Post the first homework assignment for your sections." action={<Button size="sm" onClick={() => setShowForm(true)}>New Homework</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((hw) => (
            <HomeworkCard
              key={hw.id}
              homework={hw}
              isOwner={hw.createdById === user?.id}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
