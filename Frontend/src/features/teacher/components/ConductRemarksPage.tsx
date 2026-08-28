'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService, studentService, conductService } from '@/lib/api';
import type { Student, RemarkType } from '@/types';
import { PageHeader, Button, Card, CardContent, Input, Select } from '@/features/shared/components';
import { useForm, composeValidators, required, minLength } from '@/lib/utils';
import RemarkTypePicker from './parts/RemarkTypePicker';
import toast from 'react-hot-toast';

export default function ConductRemarksPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);

  const { values, errors, isSubmitting, setValue, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { sectionId: '', studentId: '', type: 'POSITIVE', title: '', description: '' },
    validators: {
      sectionId: required('Select a section'),
      studentId: required('Select a student'),
      type: required('Select a remark type'),
      title: composeValidators(required('Remark is required'), minLength(3)),
    },
    onSubmit: async (v) => {
      try {
        await conductService.create({
          studentId: v.studentId as string,
          type: v.type as RemarkType,
          title: v.title as string,
          description: (v.description as string) || undefined,
        });
        toast.success('Remark sent to parent');
        setValue('studentId', '');
        setValue('type', 'POSITIVE');
        setValue('title', '');
        setValue('description', '');
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to submit remark');
      }
    },
  });

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      try {
        const classes = await academicService.getClassesBySchool(schoolId);
        // Backend listClassesBySchool nested sections include karta hai — ek hi request
        const opts: { id: string; label: string }[] = [];
        for (const c of classes) {
          (c.sections ?? []).forEach((s) => opts.push({ id: s.id, label: `${c.name} — ${s.name}` }));
        }
        setSections(opts);
      } catch {
        setSections([]);
      }
    })();
  }, [schoolId]);

  useEffect(() => {
    if (!values.sectionId) {
      setStudents([]);
      return;
    }
    (async () => {
      try {
        setStudents(await studentService.getAll({ schoolId, sectionId: values.sectionId, status: 'ACTIVE' }));
      } catch {
        setStudents([]);
      }
    })();
  }, [values.sectionId, schoolId]);

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue('sectionId', e.target.value);
    setValue('studentId', '');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Conduct Remarks" description="Quick 10-second behaviour note — instantly emailed to parents." />

      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Section"
                options={sections.map((s) => ({ value: s.id, label: s.label }))}
                placeholder="Filter by section"
                value={values.sectionId as string}
                onChange={handleSectionChange}
                onBlur={() => handleBlur('sectionId')}
                error={errors.sectionId}
                required
              />
              <Select
                label="Student"
                options={students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.rollNumber})` }))}
                placeholder={values.sectionId ? 'Select student' : 'Select a section first'}
                value={values.studentId as string}
                onChange={(e) => setValue('studentId', e.target.value)}
                onBlur={() => handleBlur('studentId')}
                error={errors.studentId}
                disabled={!values.sectionId}
                required
              />
            </div>

            <RemarkTypePicker value={values.type as string} error={errors.type} onChange={(t) => setValue('type', t)} />

            <Input
              label="Title"
              name="title"
              placeholder="e.g. Helped a classmate"
              value={values.title as string}
              onChange={handleChange}
              onBlur={() => handleBlur('title')}
              error={errors.title}
              required
            />
            <Input
              label="Description (optional)"
              name="description"
              placeholder="Short note"
              value={values.description as string}
              onChange={handleChange}
              onBlur={() => handleBlur('description')}
            />
            <Button type="submit" loading={isSubmitting}>Send Remark</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
