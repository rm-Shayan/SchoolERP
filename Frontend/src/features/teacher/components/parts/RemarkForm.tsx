'use client';

import { useEffect, useState } from 'react';
import { academicService, staffService, studentService, conductService } from '@/lib/api';
import type { ConductRemark } from '@/lib/api/conductService';
import type { Student, RemarkType, User } from '@/types';
import { Button, Card, CardContent, Input, Select } from '@/features/shared/components';
import { useForm, composeValidators, required, minLength } from '@/lib/utils';
import RemarkTypePicker from './RemarkTypePicker';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/store/hooks';

const canPostOnBehalf = (role?: string) => role === 'ADMIN' || role === 'SUPER_ADMIN';
const noop = () => undefined;

interface Props {
  editing: ConductRemark | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function RemarkForm({ editing, onSaved, onCancel }: Props) {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const isManager = canPostOnBehalf(user?.role);
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [onBehalf, setOnBehalf] = useState('');

  const { values, errors, isSubmitting, setValue, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { sectionId: '', studentId: '', type: 'POSITIVE', title: '', description: '' },
    validators: {
      // Edit mode me student/section locked hota hai — sirf type/comment badalte hain.
      sectionId: editing ? noop : required('Select a section'),
      studentId: editing ? noop : required('Select a student'),
      type: required('Select a remark type'),
      title: composeValidators(required('Remark is required'), minLength(editing ? 1 : 3)),
    },
    onSubmit: async (v) => {
      try {
        if (editing) {
          await conductService.update(editing.id, { type: v.type as RemarkType, comment: v.title as string });
          toast.success('Remark updated');
        } else {
          await conductService.create({
            studentId: v.studentId as string,
            type: v.type as RemarkType,
            title: v.title as string,
            description: (v.description as string) || undefined,
            teacherId: isManager && onBehalf ? onBehalf : undefined,
          });
          toast.success('Remark sent to parent');
        }
        if (!editing) {
          setValue('studentId', ''); setValue('type', 'POSITIVE'); setValue('title', ''); setValue('description', '');
          setOnBehalf('');
        }
        onSaved();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to submit remark');
      }
    },
  });

  useEffect(() => {
    if (!schoolId) return;
    academicService.getClassesBySchool(schoolId).then((classes) => {
      const opts: { id: string; label: string }[] = [];
      for (const c of classes) (c.sections ?? []).forEach((s) => opts.push({ id: s.id, label: `${c.name} — ${s.name}` }));
      setSections(opts);
    }).catch(() => setSections([]));
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !isManager || editing) { setTeachers([]); return; }
    staffService.getAll({ schoolId, role: 'TEACHER', pageSize: 200 }).then((res) => setTeachers(res.items)).catch(() => {});
  }, [schoolId, isManager, editing]);

  useEffect(() => {
    if (!values.sectionId) { setStudents([]); return; }
    studentService.getAll({ schoolId, sectionId: values.sectionId, status: 'ACTIVE' }).then(setStudents).catch(() => setStudents([]));
  }, [values.sectionId, schoolId]);

  useEffect(() => {
    if (editing) {
      setValue('title', editing.comment || '');
      setValue('type', editing.type);
    }
  }, [editing]);

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue('sectionId', e.target.value); setValue('studentId', '');
  };

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Section" options={sections.map((s) => ({ value: s.id, label: s.label }))}
              placeholder="Filter by section" value={values.sectionId as string}
              onChange={handleSectionChange} onBlur={() => handleBlur('sectionId')}
              error={errors.sectionId} required disabled={!!editing} />
            <Select label="Student" options={students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.rollNumber})` }))}
              placeholder={values.sectionId ? 'Select student' : 'Select a section first'}
              value={values.studentId as string} onChange={(e) => setValue('studentId', e.target.value)}
              onBlur={() => handleBlur('studentId')} error={errors.studentId}
              disabled={!values.sectionId || !!editing} required />
          </div>
          {isManager && !editing && (
            <Select label="Post on behalf of (teacher)" options={[{ value: '', label: `Myself (${user?.name ?? 'Me'})` }, ...teachers.map((t) => ({ value: t.id, label: t.name }))]}
              value={onBehalf} onChange={(e) => setOnBehalf(e.target.value)} />
          )}
          <RemarkTypePicker value={values.type as string} error={errors.type} onChange={(t) => setValue('type', t)} />
          <Input label="Comment" name="title" placeholder="e.g. Helped a classmate"
            value={values.title as string} onChange={handleChange}
            onBlur={() => handleBlur('title')} error={errors.title} required />
          <div className="flex gap-2">
            <Button type="submit" loading={isSubmitting}>{editing ? 'Update Remark' : 'Send Remark'}</Button>
            {editing && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
