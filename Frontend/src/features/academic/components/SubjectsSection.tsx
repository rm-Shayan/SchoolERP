'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService } from '@/lib/api';
import { Card, Button, EmptyState, TableSkeleton } from '@/features/shared/components';
import SubjectLinkForm from './parts/SubjectLinkForm';
import ClassSubjectsCard from './parts/ClassSubjectsCard';
import toast from 'react-hot-toast';

interface ClassRow { id: string; name: string; subjects: { id: string; name: string; code?: string }[]; }

export default function SubjectsSection() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      // Backend listClassesBySchool includes nested subjects — single request
      const data = await academicService.getClassesBySchool(schoolId);
      const rows = data.map((c) => ({
        id: c.id,
        name: c.name,
        subjects: (c.subjects ?? []).map(({ id, name, code }) => ({ id, name, code })),
      }));
      setClasses(rows);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  // Optimistic local-state updates — no full reload after each action
  const createSubject = async (v: { name: string; code?: string; classIds: string[] }) => {
    try {
      const results = await Promise.all(v.classIds.map((classId) => academicService.createSubject(classId, { name: v.name, code: v.code })));
      setClasses((prev) =>
        prev.map((c) => {
          const idx = v.classIds.indexOf(c.id);
          if (idx === -1) return c;
          const created = results[idx];
          return { ...c, subjects: [...c.subjects, { id: created.id, name: created.name, code: created.code }] };
        }),
      );
      toast.success(`Subject linked to ${v.classIds.length} class(es)`);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create subject');
    }
  };

  const deleteSubject = async (id: string, name: string) => {
    if (!confirm(`Remove subject "${name}" from this class?`)) return;
    setClasses((prev) => prev.map((c) => ({ ...c, subjects: c.subjects.filter((s) => s.id !== id) })));
    try {
      await academicService.deleteSubject(id);
      toast.success('Subject removed');
    } catch (err: any) {
      load(); // rollback via reconcile
      toast.error(err?.response?.data?.message ?? 'Failed to delete subject');
    }
  };

  const totalLinks = classes.reduce((sum, c) => sum + c.subjects.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}>Add Subject</Button>
      </div>

      {showForm && (
        <SubjectLinkForm classes={classes.map((c) => ({ id: c.id, name: c.name }))} onClose={() => setShowForm(false)} onSubmit={createSubject} />
      )}

      {loading ? (
        <Card><TableSkeleton rows={4} cols={3} /></Card>
      ) : classes.length === 0 ? (
        <EmptyState icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} title="No classes yet" description="Create classes first — then you can attach subjects to each one." />
      ) : (
      <>
      {/* Mobile: card list (instead of a table) */}
      <div className="md:hidden space-y-3">
        {classes.map((c) => (
          <ClassSubjectsCard key={c.id} name={c.name} subjects={c.subjects} onRemove={deleteSubject} onLink={() => setShowForm(true)} />
        ))}
      </div>

      {/* Desktop: table */}
      <Card className="overflow-hidden hidden md:block">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
          <h3 className="font-semibold text-gray-900">Subjects by Class</h3>
          <span className="text-xs text-gray-500">{classes.length} classes · {totalLinks} links</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 w-48">Class</th>
                <th className="px-5 py-3">Subjects</th>
                <th className="px-5 py-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3">
                    {c.subjects.length === 0 ? (
                      <span className="text-xs text-gray-400">No subjects linked</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {c.subjects.map((s) => (
                          <span key={s.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                            {s.name}
                            <button
                              type="button"
                              title="Remove subject"
                              className="text-gray-400 hover:text-red-600"
                              onClick={() => deleteSubject(s.id, s.name)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>+ Link</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}
    </div>
  );
}
