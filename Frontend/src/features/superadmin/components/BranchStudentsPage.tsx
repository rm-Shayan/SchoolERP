'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { studentService, academicService, schoolService } from '@/lib/api';
import type { Student, Class, School } from '@/types';
import { ConfirmDialog, PageHeader } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useStudentsQuery } from '@/features/school/hooks/useStudentsQuery';
import { StudentStats } from '@/features/school/components/parts/StudentStats';
import { StudentToolbar } from '@/features/school/components/parts/StudentToolbar';
import { StudentList } from '@/features/school/components/parts/StudentList';
import { StudentFormModal, type StudentFormValues } from '@/features/school/components/parts/StudentFormModal';
import { StudentDetails } from '@/features/school/components/parts/StudentDetails';
import { getLastClassIds, studentUpdatePayload } from '@/features/school/components/parts/helpers';
import { StudentsHeaderActions } from '@/features/school/components/parts/StudentsHeaderActions';
import Breadcrumbs from './parts/Breadcrumbs';
export default function BranchStudentsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const schoolId = params?.schoolId as string;
  const [school, setSchool] = useState<School | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [editing, setEditing] = useState<Student | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [passTarget, setPassTarget] = useState<Student | null>(null);
  const [passBusy, setPassBusy] = useState(false);
  const lastClassIds = useMemo(() => getLastClassIds(classes), [classes]);
  const {
    students, total, summary, loading, refetching,
    search, setSearch,
    statusFilter, setStatusFilter,
    sectionFilter, setSectionFilter,
    page, setPage, pageSize, setPageSize, totalPages, reload, exportCsv,
  } = useStudentsQuery(schoolId);
  useEffect(() => {
    if (!schoolId) return;
    academicService.getClassesBySchool(schoolId).then((data) => setClasses(data.map((c) => ({ ...c, sections: c.sections ?? [] })))).catch(() => toast.error('Failed to load classes'));
    schoolService.getById(schoolId).then(setSchool).catch(() => {});
  }, [schoolId]);
  const handlePassedOut = async () => {
    if (!passTarget) return;
    setPassBusy(true);
    try {
      const updated = await studentService.updateStatus(passTarget.id, 'GRADUATED');
      toast.success(`${passTarget.firstName} ${passTarget.lastName} passed out`);
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
      setPassTarget(null);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to mark passed out');
    } finally {
      setPassBusy(false);
    }
  };
  const handleEditSubmit = useCallback(
    async (values: StudentFormValues): Promise<boolean> => {
      if (!editing) return false;
      try {
        const updated = await studentService.update(editing.id, studentUpdatePayload(values));
        toast.success('Student updated successfully');
        setSelected((prev) => (prev?.id === updated.id ? updated : prev));
        reload();
        return true;
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to update student');
        return false;
      }
    },
    [editing, reload]
  );
  const backToBranch = orgId && schoolId ? `/admin/organizations/${orgId}/schools/${schoolId}` : '/admin/branches';
  return (
    <div className="sa-detail-workspace space-y-5 sm:space-y-6">
      <Breadcrumbs items={[
        { label: 'Super Admin' },
        { label: 'Organizations', to: '/admin/organizations' },
        { label: school?.name ?? 'Branch' },
        { label: 'Students' },
      ]} />
      <div className="sa-detail-band"><PageHeader
        title="Students"
        description="Full student management for this branch (create, ID cards, block & lifecycle status)."
        actions={
          <>
            <Link href={backToBranch} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">← Branch Details</Link>
            <StudentsHeaderActions onExport={exportCsv} />
          </>
        }
      /></div>
      <StudentStats summary={summary} />
      <StudentToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sectionFilter={sectionFilter}
        onSectionChange={setSectionFilter}
        classes={classes}
        resultCount={total}
      />
      <StudentList
        loading={loading}
        refetching={refetching}
        students={students}
        total={total}
        hasFilters={!!search.trim() || !!statusFilter || !!sectionFilter}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        lastClassIds={lastClassIds}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onView={setSelected}
        onEdit={setEditing}
        onPassedOut={setPassTarget}
      />
      <StudentFormModal
        key={editing?.id ?? 'none'}
        open={!!editing}
        onClose={() => setEditing(null)}
        classes={classes}
        mode="edit"
        student={editing}
        onSubmit={handleEditSubmit}
      />
      <StudentDetails
        student={selected}
        lastClassIds={lastClassIds}
        onClose={() => setSelected(null)}
        onUpdated={(updated) => { setSelected(updated); reload(); }}
        onEdit={setEditing}
        onDeleted={() => { setSelected(null); setEditing(null); reload(); }}
      />
      <ConfirmDialog
        open={!!passTarget}
        title="Mark as Passed Out?"
        message={`${passTarget ? `${passTarget.firstName} ${passTarget.lastName}` : 'Student'} is in the school's final class. Marking as Passed Out archives the record (fee/attendance history stays safe), and it can be reactivated anytime.`}
        confirmLabel="Passed Out"
        loading={passBusy}
        onConfirm={handlePassedOut}
        onCancel={() => setPassTarget(null)}
      />
    </div>
  );
}
