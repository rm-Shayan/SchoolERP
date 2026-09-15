'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService, homeworkService } from '@/lib/api';
import type { Homework } from '@/lib/api/homeworkService';
import { PageHeader, Button, Modal, ConfirmDialog } from '@/features/shared/components';
import HomeworkForm, { type SectionOption, type HomeworkFormValues } from './parts/HomeworkForm';
import HomeworkList from './parts/HomeworkList';
import toast from 'react-hot-toast';

export default function HomeworkPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const [deleting, setDeleting] = useState<Homework | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  const loadSections = useCallback(async () => {
    setLoadingSections(true);
    try {
      const classes = await academicService.getClassesBySchool(schoolId ?? '');
      const opts: SectionOption[] = [];
      for (const c of classes) {
        (c.sections ?? []).forEach((s) => opts.push({ id: s.id, label: `${c.name} — ${s.name}`, classId: c.id }));
      }
      setSections(opts);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load sections');
    } finally {
      setLoadingSections(false);
    }
  }, [schoolId]);

  useEffect(() => { loadSections(); }, [loadSections]);

  const handleCreate = async (values: HomeworkFormValues) => {
    try {
      const payload: any = { sectionId: values.sectionId, title: values.title, content: values.content };
      if (values.subjectIds?.length) payload.subjectIds = values.subjectIds;
      await homeworkService.create(payload);
      toast.success('Homework broadcast to parents');
      setShowForm(false);
      reload();
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
      reload();
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
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete homework');
    } finally {
      setDeletingLoading(false);
    }
  };

  const openNew = () => { setEditing(null); setShowForm(true); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description="Post homework per section — parents get notified instantly."
        actions={<Button size="sm" onClick={openNew}>New Homework</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Post Homework">
        <HomeworkForm
          sections={sections}
          sectionsLoading={loadingSections && sections.length === 0}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Homework">
        {editing && (
          <HomeworkForm
            sections={sections}
            initialValues={{ sectionId: editing.sectionId, title: editing.title, content: editing.content }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete Homework"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deletingLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      <HomeworkList
        userId={user?.id}
        reloadKey={reloadKey}
        onEdit={setEditing}
        onDelete={setDeleting}
        onNeedCreate={openNew}
      />
    </div>
  );
}