'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/features/shared/components';
import { academicService } from '@/lib/api';
import type { Class, Section, Subject } from '@/lib/api/academicService';

interface TeacherAssignmentFieldsProps {
  schoolId: string;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function TeacherAssignmentFields({
  schoolId,
  values,
  errors,
  onChange,
}: TeacherAssignmentFieldsProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schoolId) {
      setClasses([]);
      setSections([]);
      setSubjects([]);
      return;
    }
    setLoading(true);
    academicService
      .getClassesBySchool(schoolId)
      .then((data) => setClasses(data))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const selectedClassId = (values.teacherClassId as string) || '';
  const selectedSectionId = (values.teacherSectionId as string) || '';

  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      setSubjects([]);
      return;
    }
    const cls = classes.find((c) => c.id === selectedClassId);
    setSections(cls?.sections ?? []);
    setSubjects(cls?.subjects ?? []);
    if (selectedSectionId && !cls?.sections?.some((s) => s.id === selectedSectionId)) {
      onChange({ target: { name: 'teacherSectionId', value: '' } } as React.ChangeEvent<HTMLSelectElement>);
    }
  }, [selectedClassId, classes, selectedSectionId, onChange]);

  if (!schoolId) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
      <p className="text-sm font-semibold text-blue-800">Teaching Assignment *</p>
      <p className="text-xs text-blue-600">
        Assign this teacher to a class, section and subject.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select
          label="Class"
          name="teacherClassId"
          placeholder={loading ? 'Loading…' : 'Select class'}
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          value={selectedClassId}
          onChange={onChange}
          error={errors.teacherClassId}
        />
        <Select
          label="Section"
          name="teacherSectionId"
          placeholder={!selectedClassId ? 'Select class first' : 'Select section'}
          options={sections.map((s) => ({ value: s.id, label: s.name }))}
          value={selectedSectionId}
          onChange={onChange}
          error={errors.teacherSectionId}
        />
        <Select
          label="Subject"
          name="teacherSubjectId"
          placeholder={!selectedClassId ? 'Select class first' : 'Select subject'}
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          value={(values.teacherSubjectId as string) || ''}
          onChange={onChange}
          error={errors.teacherSubjectId}
        />
      </div>
    </div>
  );
}
