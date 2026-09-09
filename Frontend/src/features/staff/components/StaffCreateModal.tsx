'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { staffService, teachingAssignmentService } from '@/lib/api';
import { academicService, type Class, type Section, type Subject } from '@/lib/api/academicService';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import AvatarUpload from '@/features/shared/components/AvatarUpload';
import { getRoleLabel, useForm, composeValidators, required, isEmail, isPhonePK } from '@/lib/utils';
import toast from 'react-hot-toast';

const ROLES = ['TEACHER', 'RECEPTIONIST'];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function StaffCreateModal({ open, onClose, onCreated }: Props) {
  const { school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id;
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const loadClasses = useCallback(async () => {
    if (!schoolId) return;
    try { setClasses(await academicService.getClassesBySchool(schoolId)); }
    catch { toast.error('Failed to load classes'); }
  }, [schoolId]);

  useEffect(() => {
    if (open) { loadClasses(); setClassId(''); setSectionId(''); setSelectedSubjects([]); setAvatarFile(null); }
  }, [open, loadClasses]);

  useEffect(() => {
    if (!classId) { setSections([]); setSubjects([]); setSectionId(''); setSelectedSubjects([]); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const [s, sub] = await Promise.all([
          academicService.getSectionsByClass(classId),
          academicService.getSubjectsByClass(classId),
        ]);
        if (!ac.signal.aborted) { setSections(s); setSubjects(sub); }
      } catch { /* ignore */ }
    })();
    return () => ac.abort();
  }, [classId]);

  const subjectOpts = useMemo(() => subjects.map((s) => ({ value: s.id, label: s.name })), [subjects]);
  const sectionOpts = useMemo(() => [{ value: '', label: 'All sections' }, ...sections.map((s) => ({ value: s.id, label: s.name }))], [sections]);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: '', email: '', phone: '', role: 'TEACHER' },
    validators: {
      name: required('Full name is required'),
      email: composeValidators(required('Email is required'), isEmail()),
      phone: isPhonePK(),
      role: required('Role is required'),
    },
    onSubmit: async (v) => {
      try {
        const user = await staffService.create({
          name: v.name as string,
          email: v.email as string,
          phone: (v.phone as string).trim() || undefined,
          role: v.role as string,
          schoolId,
        }, avatarFile || undefined);
        if (v.role === 'TEACHER' && classId) {
          const subs = selectedSubjects.length ? selectedSubjects : [''];
          await Promise.all(
            subs.map((subjectId) =>
              teachingAssignmentService.assign(schoolId!, {
                teacherId: user.id,
                classId,
                ...(sectionId ? { sectionId } : {}),
                ...(subjectId ? { subjectId } : {}),
              })
            )
          );
        }
        toast.success('Staff created — password is the shared school password');
        onCreated();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to create staff');
      }
    },
  });

  const toggleSubject = (id: string) =>
    setSelectedSubjects((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Modal open={open} onClose={onClose} title="Add Staff Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" name="name" placeholder="e.g. Ayesha Khan" value={values.name as string} onChange={handleChange} onBlur={() => handleBlur('name')} error={errors.name} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" name="email" type="email" placeholder="staff@school.com" value={values.email as string} onChange={handleChange} onBlur={() => handleBlur('email')} error={errors.email} required />
          <Input label="Phone" name="phone" placeholder="0300 1234567" value={values.phone as string} onChange={handleChange} onBlur={() => handleBlur('phone')} error={errors.phone} />
        </div>
        <AvatarUpload name={values.name as string} onFileSelect={setAvatarFile} />
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          All staff use the same shared password (the School Code). No per-user password is needed.
        </p>
        <Select label="Role" name="role" options={ROLES.map((r) => ({ value: r, label: getRoleLabel(r) }))} value={values.role as string} onChange={handleChange} />
        {(values.role as string) === 'TEACHER' && (
          <div className="space-y-3 rounded-xl border border-slate-200 p-3">
            <h4 className="text-sm font-semibold text-slate-700">Teaching Assignment</h4>
            <Select label="Class" placeholder="Select a class" options={classes.map((c) => ({ value: c.id, label: c.name }))} value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(''); setSelectedSubjects([]); }} />
            {classId && sections.length > 0 && (
              <Select label="Section (optional)" placeholder="All sections" options={sectionOpts} value={sectionId} onChange={(e) => setSectionId(e.target.value)} />
            )}
            {classId && (
              <>
                <p className="text-xs font-medium text-slate-500">Teach as Subject Teacher for (optional):</p>
                {subjectOpts.length === 0 ? (
                  <p className="text-xs text-slate-400">No subjects for this class — staff will be Class Teacher (all subjects).</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {subjectOpts.map((o) => (
                      <label key={o.value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                        <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={selectedSubjects.includes(o.value)} onChange={() => toggleSubject(o.value)} />
                        {o.label}
                      </label>
                    ))}
                  </div>
                )}
                {selectedSubjects.length === 0 && <p className="text-xs text-amber-600">No subject selected → Class Teacher (all subjects).</p>}
              </>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Staff</Button>
        </div>
      </form>
    </Modal>
  );
}
