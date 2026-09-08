'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { studyMaterialService, academicService } from '@/lib/api';
import type { StudyMaterial } from '@/lib/api/studyMaterialService';
import type { SectionOption, SubjectOption } from '@/features/teacher/components/parts/HomeworkForm';
import { PageHeader, Button, Card, EmptyState, Modal, CardGridSkeleton, ConfirmDialog, Select } from '@/features/shared/components';
import StudyMaterialCard from '@/features/shared/components/parts/StudyMaterialCard';
import StudyMaterialForm from '@/features/shared/components/parts/StudyMaterialForm';
import toast from 'react-hot-toast';

export default function StudyMaterialPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [items, setItems] = useState<StudyMaterial[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [deleting, setDeleting] = useState<StudyMaterial | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, classes] = await Promise.all([
        studyMaterialService.getAll({ sectionId: sectionId || undefined, pageSize: 100 }),
        academicService.getClassesBySchool(schoolId ?? ''),
      ]);
      setItems(list.items);
      const opts: SectionOption[] = [];
      for (const c of classes) (c.sections ?? []).forEach((s) => opts.push({ id: s.id, label: `${c.name} — ${s.name}`, classId: c.id }));
      setSections(opts);

      const classId = sections.find((s) => s.id === sectionId)?.classId ?? classes[0]?.id ?? '';
      if (classId) {
        const subjects = await academicService.getSubjectsByClass(classId);
        const subjectOpts: SubjectOption[] = subjects.map((s) => ({ id: s.id, label: s.name }));
        setSubjects(subjectOpts);
      } else {
        setSubjects([]);
      }
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [schoolId, sectionId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (item: StudyMaterial) => { setEditing(item); setShowForm(true); };

  const handleSubmit = async (fd: FormData) => {
    setSubmitting(true);
    try {
      if (editing) {
        await studyMaterialService.update(editing.id, fd);
        toast.success('Updated');
      } else {
        await studyMaterialService.create(fd);
        toast.success('Created');
      }
      setShowForm(false); setEditing(null); load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return; setDeleteBusy(true);
    try { await studyMaterialService.remove(deleting.id); toast.success('Deleted'); setDeleting(null); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed'); }
    finally { setDeleteBusy(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Study Materials" description="Upload study material for your students." actions={<Button size="sm" onClick={openCreate}>New Material</Button>} />
      <Modal open={showForm} onClose={() => { if (!submitting) { setShowForm(false); setEditing(null); } }} title={editing ? 'Edit Material' : 'New Material'}>
        <StudyMaterialForm sections={sections} subjects={subjects} initialValues={editing ? { title: editing.title, description: editing.description ?? '', type: editing.type, file: null, linkUrl: editing.linkUrl ?? '', sectionId: editing.sectionId ?? '', subjectId: editing.subjectId ?? '' } : undefined} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(null); }} submitLabel={editing ? 'Update' : 'Create'} submitting={submitting} />
      </Modal>      <ConfirmDialog open={!!deleting} title="Delete material?" message={`"${deleting?.title}" will be permanently deleted.`} confirmLabel="Delete" loading={deleteBusy} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />      <div className="max-w-xs"><Select
        label="Filter by Section"
        placeholder="All sections"
        options={sections.map((s) => ({ value: s.id, label: s.label }))}
        value={sectionId}
        onChange={(e) => { setSectionId(e.target.value); load(); }}
      />
</div>
      {loading ? <CardGridSkeleton count={4} /> : items.length === 0 ? (
        <Card><EmptyState title="No materials yet" description="Upload the first study material for your students." action={<Button size="sm" onClick={openCreate}>New Material</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const isOwner = item.createdById && user?.id && item.createdById === user?.id;
            return <StudyMaterialCard key={item.id} item={item} onEdit={isOwner ? openEdit : undefined} onDelete={isOwner ? setDeleting : undefined} />;
          })}
        </div>
      )}
    </div>
  );
}
