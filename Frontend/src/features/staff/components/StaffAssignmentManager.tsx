'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { teachingAssignmentService, academicService } from '@/lib/api';
import type { TeachingAssignment } from '@/lib/api/teachingAssignmentService';
import type { Class, Section, Subject } from '@/lib/api/academicService';
import { Select, Button, Badge, ListSkeleton } from '@/features/shared/components';
import toast from 'react-hot-toast';

interface Props {
  teacherId: string;
  schoolId: string;
}

export default function StaffAssignmentManager({ teacherId, schoolId }: Props) {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        teachingAssignmentService.list(schoolId, { teacherId }),
        academicService.getClassesBySchool(schoolId),
      ]);
      setAssignments(a);
      setClasses(c);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [schoolId, teacherId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!classId) { setSections([]); setSubjects([]); setSectionId(''); setSubjectId(''); return; }
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

  const handleAdd = async () => {
    if (!classId) { toast.error('Select a class first'); return; }
    setSaving(true);
    try {
      await teachingAssignmentService.assign(schoolId, {
        teacherId,
        classId,
        ...(sectionId ? { sectionId } : {}),
        ...(subjectId ? { subjectId } : {}),
      });
      toast.success('Assignment added');
      setClassId(''); setSectionId(''); setSubjectId('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await teachingAssignmentService.remove(id);
      toast.success('Assignment removed');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to remove');
    }
  };

  const classOpts = useMemo(() => classes.map((c) => ({ value: c.id, label: c.name })), [classes]);
  const sectionOpts = useMemo(() => [{ value: '', label: 'All sections' }, ...sections.map((s) => ({ value: s.id, label: s.name }))], [sections]);
  const subjectOpts = useMemo(() => [{ value: '', label: 'All subjects' }, ...subjects.map((s) => ({ value: s.id, label: s.name }))], [subjects]);

  return (
    <div className="rounded-xl border border-slate-200 p-3 space-y-3">
      <h4 className="text-sm font-semibold text-slate-700">Teaching Assignments</h4>
      {loading ? (
        <ListSkeleton count={3} />
      ) : assignments.length > 0 ? (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge>{a.class?.name ?? '—'}</Badge>
                {a.section?.name && <Badge>{a.section.name}</Badge>}
                {a.subject?.name ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">{a.subject.name}</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700">Class Teacher</span>
                )}
              </div>
              <button onClick={() => handleRemove(a.id)} className="text-xs text-red-500 hover:text-red-700 ml-2 shrink-0">Remove</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">No assignments yet.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Select placeholder="Select class" options={classOpts} value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(''); setSubjectId(''); }} />
        {sections.length > 0 && <Select placeholder="Section (optional)" options={sectionOpts} value={sectionId} onChange={(e) => setSectionId(e.target.value)} />}
        {subjects.length > 0 && <Select placeholder="Subject (optional)" options={subjectOpts} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />}
      </div>
      <Button size="sm" variant="outline" disabled={saving || !classId} onClick={handleAdd}>
        {saving ? 'Adding...' : 'Add Assignment'}
      </Button>
    </div>
  );
}
