'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { staffService, teachingAssignmentService } from '@/lib/api';
import type { TeachingAssignment } from '@/lib/api/teachingAssignmentService';
import { academicService, type Class } from '@/lib/api/academicService';
import { PageHeader, Button, Card, EmptyState, ConfirmDialog } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import AssignmentFormModal from './parts/AssignmentFormModal';
import AssignmentFilterBar from './parts/AssignmentFilterBar';
import AssignmentPageSkeleton from './parts/AssignmentPageSkeleton';

export default function TeachingAssignmentsPage() {
  const { school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id;
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [assigns, classList, staff] = await Promise.all([
        teachingAssignmentService.list(schoolId),
        academicService.getClassesBySchool(schoolId),
        staffService.getAll({ schoolId, role: 'TEACHER', pageSize: 500 }),
      ]);
      setAssignments(assigns);
      setClasses(classList);
      setTeachers(staff.items.map((u) => ({ id: u.id, name: u.name })));
    } catch { toast.error('Failed to load assignments'); }
    finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['assignment_updated'], load);

  const filtered = useMemo(() => {
    let list = assignments;
    if (filterTeacher) list = list.filter((a) => a.teacherId === filterTeacher);
    if (filterClass) list = list.filter((a) => a.classId === filterClass);
    return list;
  }, [assignments, filterTeacher, filterClass]);

  const grouped = useMemo(() => {
    const map = new Map<string, TeachingAssignment[]>();
    filtered.forEach((a) => { const k = a.teacher?.name ?? 'Unknown'; if (!map.has(k)) map.set(k, []); map.get(k)!.push(a); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handleRemove = async () => {
    if (!removeId) return;
    try { await teachingAssignmentService.remove(removeId); toast.success('Assignment removed'); setRemoveId(null); load(); }
    catch { toast.error('Failed to remove assignment'); }
  };

  const editingAssignment = editingId ? assignments.find((a) => a.id === editingId) ?? null : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Teaching Assignments" description="Assign class teachers and subject teachers for each class"
        actions={<Button size="sm" onClick={() => { setEditingId(null); setAssignOpen(true); }}>Assign Teacher</Button>} />
      {assignments.length > 0 && <AssignmentFilterBar teachers={teachers} classes={classes} filterTeacher={filterTeacher} filterClass={filterClass}
        onTeacherChange={setFilterTeacher} onClassChange={setFilterClass} onClear={() => { setFilterTeacher(''); setFilterClass(''); }} />}
      {loading ? <AssignmentPageSkeleton /> : grouped.length === 0 ? (
        <Card><EmptyState title={assignments.length === 0 ? 'No assignments yet' : 'No matching assignments'}
          description={assignments.length === 0 ? 'Assign teachers to classes to get started.' : 'Try changing the filters.'} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {grouped.map(([name, items]) => (
            <Card key={name} className="overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{items.length} assignment{items.length !== 1 ? 's' : ''}</p>
              </div>
              <ul className="divide-y divide-gray-50">
                {items.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/50 transition-colors">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-slate-800">{a.class?.name}</span>
                      {a.section && <span className="text-xs text-slate-400 ml-1.5">· Section {a.section.name}</span>}
                      {a.subject ? (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">Subject: {a.subject.name}</span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700">Class Teacher</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditingId(a.id); setAssignOpen(true); }} className="p-1 text-gray-400 hover:text-primary-600" title="Edit">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setRemoveId(a.id)} className="p-1 text-gray-400 hover:text-red-600" title="Remove">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
      {assignOpen && <AssignmentFormModal schoolId={schoolId!} teachers={teachers} classes={classes} assignment={editingAssignment}
        onClose={() => { setAssignOpen(false); setEditingId(null); }} onAssigned={() => { setAssignOpen(false); setEditingId(null); load(); }} />}
      <ConfirmDialog open={!!removeId} title="Remove assignment?" message="This teacher will no longer be incharge of this class/subject."
        confirmLabel="Remove" onConfirm={handleRemove} onCancel={() => setRemoveId(null)} />
    </div>
  );
}
