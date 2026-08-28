'use client';

import { useEffect, useState } from 'react';
import { teachingAssignmentService, type TeachingAssignment } from '@/lib/api/teachingAssignmentService';
import { academicService, type Class, type Subject, type Section } from '@/lib/api/academicService';
import { Modal, Select, Button } from '@/features/shared/components';
import { required, useForm } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  schoolId: string;
  teachers: { id: string; name: string }[];
  classes: Class[];
  assignment?: TeachingAssignment | null;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignmentFormModal({ schoolId, teachers, classes, assignment, onClose, onAssigned }: Props) {
  const isEdit = Boolean(assignment);
  const [classId, setClassId] = useState(assignment?.classId ?? '');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjectId, setSubjectId] = useState(assignment?.subjectId ?? '');
  const [sectionId, setSectionId] = useState(assignment?.sectionId ?? '');
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    setSubjectId(assignment?.subjectId ?? '');
    setSectionId(assignment?.sectionId ?? '');
    setSubjects([]);
    setSections([]);
    if (!classId) return;
    setMetaLoading(true);
    Promise.all([
      academicService.getSubjectsByClass(classId).then(setSubjects),
      academicService.getSectionsByClass(classId).then(setSections),
    ]).catch(() => toast.error('Failed to load subjects/sections')).finally(() => setMetaLoading(false));
  }, [classId]);

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({
    initialValues: { teacherId: assignment?.teacherId ?? '' },
    validators: { teacherId: required('Select a teacher') },
    onSubmit: async (v) => {
      if (!classId) { toast.error('Select a class'); return; }
      try {
        if (isEdit && assignment) {
          await teachingAssignmentService.remove(assignment.id);
          await teachingAssignmentService.assign(schoolId, {
            teacherId: v.teacherId as string,
            classId,
            ...(subjectId ? { subjectId } : {}),
            ...(sectionId ? { sectionId } : {}),
          });
          toast.success('Assignment updated');
        } else {
          await teachingAssignmentService.assign(schoolId, {
            teacherId: v.teacherId as string,
            classId,
            ...(subjectId ? { subjectId } : {}),
            ...(sectionId ? { sectionId } : {}),
          });
          toast.success('Assignment saved');
        }
        onAssigned();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to assign');
      }
    },
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Assignment' : 'Assign Teacher'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Teacher"
          name="teacherId"
          placeholder="Select teacher"
          options={teachers.map((t) => ({ value: t.id, label: t.name }))}
          value={values.teacherId as string}
          onChange={handleChange}
          error={errors.teacherId}
        />
        <Select
          label="Class"
          name="classId"
          placeholder="Select class"
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Subject (optional)"
            name="subjectId"
            placeholder="All subjects (Class Teacher)"
            loading={metaLoading}
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          />
          <Select
            label="Section (optional)"
            name="sectionId"
            placeholder="All sections"
            loading={metaLoading}
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
          />
        </div>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          No subject → Class Teacher (whole class). No section → all sections of the class.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Update' : 'Assign Teacher'}</Button>
        </div>
      </form>
    </Modal>
  );
}
