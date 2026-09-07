'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService, homeworkService } from '@/lib/api';
import type { Homework } from '@/lib/api/homeworkService';
import { Modal } from '@/features/shared/components';
import HomeworkForm, {
  type SectionOption,
  type SubjectOption,
  type HomeworkFormValues,
} from '@/features/teacher/components/parts/HomeworkForm';
import toast from 'react-hot-toast';

interface HomeworkPostModalProps {
  open: boolean;
  editing?: Homework | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function HomeworkPostModal({ open, editing = null, onClose, onSaved }: HomeworkPostModalProps) {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Load sections on open
  useEffect(() => {
    if (!open || sections.length > 0 || !schoolId) return;
    let cancelled = false;
    setSectionsLoading(true);
    academicService
      .getClassesBySchool(schoolId)
      .then((classes) => {
        if (cancelled) return;
        const opts: SectionOption[] = [];
        for (const c of classes) {
          (c.sections ?? []).forEach((s) =>
            opts.push({ id: s.id, label: `${c.name} — ${s.name}`, classId: c.id })
          );
        }
        setSections(opts);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSectionsLoading(false); });
    return () => { cancelled = true; };
  }, [open, schoolId, sections.length]);

  // Load subjects when section's class changes
  useEffect(() => {
    if (!selectedClassId) { setSubjects([]); return; }
    let cancelled = false;
    setSubjectsLoading(true);
    academicService
      .getSubjectsByClass(selectedClassId)
      .then((list) => {
        if (cancelled) return;
        setSubjects(list.map((s) => ({ id: s.id, label: s.name })));
      })
      .catch(() => { if (!cancelled) setSubjects([]); })
      .finally(() => { if (!cancelled) setSubjectsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedClassId]);

  const handleSectionChange = (sectionId: string) => {
    const found = sections.find((s) => s.id === sectionId);
    setSelectedClassId(found?.classId ?? null);
    setSubjects([]);
  };

  const handleSubmit = async (values: HomeworkFormValues) => {
    try {
      if (editing) {
        await homeworkService.update(editing.id, { title: values.title, content: values.content });
        toast.success('Homework updated');
      } else {
        const payload: any = { sectionId: values.sectionId, title: values.title, content: values.content };
        if (values.subjectIds?.length) payload.subjectIds = values.subjectIds;
        await homeworkService.create(payload);
        toast.success(`Homework posted for ${values.subjectIds?.length ? `${values.subjectIds.length} subject(s)` : 'section'} — parents notified`);
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? `Failed to ${editing ? 'update' : 'post'} homework`);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Homework' : 'Post Homework'}>
      <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
        {editing
          ? 'Update the title or details — the section cannot be changed.'
          : 'Select a section, choose a subject (or keep All), then add a title and details. Parents will receive an email notification.'}
      </p>
      <HomeworkForm
        key={editing?.id ?? 'new'}
        sections={sections}
        sectionsLoading={sectionsLoading && sections.length === 0}
        subjects={subjects}
        subjectsLoading={subjectsLoading}
        initialValues={editing ? { sectionId: editing.sectionId, title: editing.title, content: editing.content } : undefined}
        onSubmit={handleSubmit}
        onCancel={onClose}
        onSectionChange={handleSectionChange}
      />
    </Modal>
  );
}
