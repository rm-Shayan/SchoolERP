'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { studentService, academicService } from '@/lib/api';
import type { Student, Class } from '@/types';
import { ConfirmDialog, PageHeader } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useStudentsQuery } from '../hooks/useStudentsQuery';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { StudentStats } from './parts/StudentStats';
import { StudentToolbar } from './parts/StudentToolbar';
import { StudentList } from './parts/StudentList';
import { StudentFormModal, type StudentFormValues } from './parts/StudentFormModal';
import { StudentDetails } from './parts/StudentDetails';
import { StudentsHeaderActions } from './parts/StudentsHeaderActions';
import StudentImportModal from './parts/StudentImportModal';
import { getLastClassIds, studentCreatePayload, studentUpdatePayload } from './parts/helpers';

export default function StudentsPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [formStudent, setFormStudent] = useState<Student | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [passTarget, setPassTarget] = useState<Student | null>(null);
  const [passBusy, setPassBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const lastClassIds = useMemo(() => getLastClassIds(classes), [classes]);

  const { students, total, summary, loading, refetching, search, setSearch, statusFilter, setStatusFilter, sectionFilter, setSectionFilter, page, setPage, pageSize, setPageSize, totalPages, reload, patchStudent, removeStudent, exportCsv } = useStudentsQuery(schoolId);

  // Auto-refresh when students are created, enrolled, promoted, or status changes
  useRealtimeRefresh(['admission_enrolled', 'promotions_created', 'student_status_changed'], reload);

  useEffect(() => {
    if (!schoolId) return;
    academicService.getClassesBySchool(schoolId).then((data) => setClasses(data.map((c) => ({ ...c, sections: c.sections ?? [] })))).catch(() => toast.error('Failed to load classes')).finally(() => setClassesLoading(false));
  }, [schoolId]);

  const handlePassedOut = async () => {
    if (!passTarget) return;
    setPassBusy(true);
    try {
      const updated = await studentService.updateStatus(passTarget.id, 'GRADUATED');
      toast.success(`${passTarget.firstName} ${passTarget.lastName} passed out`);
      patchStudent(updated);
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
      setPassTarget(null);
      reload();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to mark passed out'); } finally { setPassBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await studentService.remove(deleteTarget.id);
      toast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} deleted`);
      removeStudent(deleteTarget.id);
      setSelected((prev) => (prev?.id === deleteTarget.id ? null : prev));
      setDeleteTarget(null);
      reload();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to delete student'); } finally { setDeleteBusy(false); }
  };

  const handleFormSubmit = useCallback(async (values: StudentFormValues, photoFile?: File | null): Promise<boolean> => {
    try {
      if (formMode === 'create') {
        const created = await studentService.create(schoolId!, studentCreatePayload(values));
        if (photoFile) {
          try { await studentService.uploadPhoto(created.id, photoFile); toast.success('Student added with photo'); }
          catch { toast.error('Student added, but photo upload failed'); }
        } else {
          toast.success('Student added successfully');
        }
        setFormMode(null); setFormStudent(null);
        await reload();
      } else if (formStudent) {
        const updated = await studentService.update(formStudent.id, studentUpdatePayload(values));
        if (photoFile) {
          try { const up = await studentService.uploadPhoto(formStudent.id, photoFile); updated.imageUrl = up.imageUrl; toast.success('Student updated with photo'); }
          catch { toast.error('Student updated, but photo upload failed'); }
        } else {
          toast.success('Student updated successfully');
        }
        patchStudent(updated);
        setSelected((prev) => (prev?.id === updated.id ? updated : prev));
        setFormMode(null); setFormStudent(null);
        await reload();
        patchStudent(updated); // override list in case server cache returned stale rows
      }
      return true;
    } catch (err: any) { toast.error(err?.response?.data?.message ?? (formMode === 'create' ? 'Failed to add student' : 'Failed to update student')); return false; }
  }, [formMode, formStudent, schoolId, reload, patchStudent]);

  const openEdit = (s: Student) => { setFormStudent(s); setFormMode('edit'); };

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Manage all enrolled students in this branch."
        actions={<StudentsHeaderActions onAdd={() => { setFormStudent(null); setFormMode('create'); }} onImport={() => setShowImport(true)} onExport={exportCsv} />} />

      <StudentStats summary={summary} />

      <StudentToolbar search={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusChange={setStatusFilter} sectionFilter={sectionFilter} onSectionChange={setSectionFilter} classes={classes} classesLoading={classesLoading} resultCount={total} />

      <StudentList loading={loading} refetching={refetching} students={students} total={total} hasFilters={!!search.trim() || !!statusFilter || !!sectionFilter} page={page} pageSize={pageSize} totalPages={totalPages} lastClassIds={lastClassIds} onPageChange={setPage} onPageSizeChange={setPageSize}         onView={setSelected}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onPassedOut={setPassTarget}
      />

      <StudentFormModal key={formMode === 'create' ? 'create' : formStudent?.id ?? 'none'} open={formMode !== null} onClose={() => { setFormMode(null); setFormStudent(null); }} classes={classes} mode={formMode === 'create' ? 'create' : 'edit'} student={formStudent} onSubmit={handleFormSubmit} />

      <StudentDetails student={selected} lastClassIds={lastClassIds} onClose={() => setSelected(null)} onUpdated={(updated) => { setSelected(updated); reload(); }} onEdit={openEdit} onDeleted={() => { setSelected(null); setFormStudent(null); reload(); }} />

      <StudentImportModal open={showImport} schoolId={schoolId} onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); reload(); }} />

      <ConfirmDialog open={!!passTarget} title="Mark as Passed Out?" message={`${passTarget ? `${passTarget.firstName} ${passTarget.lastName}` : 'Student'} is in the school's final class. Marking as Passed Out archives the record (fee/attendance history stays safe), and it can be reactivated anytime.`} confirmLabel="Passed Out" loading={passBusy} onConfirm={handlePassedOut} onCancel={() => setPassTarget(null)} />

      <ConfirmDialog open={!!deleteTarget} title="Delete student?" message={`Permanently delete ${deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : 'this student'}? This cannot be undone.`} confirmLabel="Delete" loading={deleteBusy} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
