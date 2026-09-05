import { Card, CardHeader, Badge, Button } from '@/features/shared/components';
import type { Student } from '@/types';
import { StudentRow } from './StudentRow';

interface StudentTableProps {
  students: Student[];
  refetching: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  lastClassIds?: Set<string>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onPassedOut?: (student: Student) => void;
}

export function StudentTable({
  students,
  refetching,
  total,
  page,
  pageSize,
  totalPages,
  lastClassIds,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  onPassedOut,
}: StudentTableProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const goTo = (p: number) => {
    onPageChange(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Card className="overflow-hidden border-gray-200/80 shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b-0 bg-gradient-to-r from-primary-50/60 via-white to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <div><h2 className="font-bold text-gray-900">Student Directory</h2><p className="mt-0.5 text-xs text-gray-500">Manage enrolled students and their records</p></div>
          <Badge variant="info">{total}</Badge>
        </div>
        <button type="button" onClick={() => { onPageSizeChange(pageSize === 5 ? 10 : 5); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group inline-flex items-center gap-1 self-start px-1 py-1 text-xs font-bold text-primary-700 hover:text-primary-800 sm:self-auto">{pageSize === 5 ? 'Expand list' : 'Collapse list'}<svg className={`h-3.5 w-3.5 transition-transform ${pageSize === 5 ? 'group-hover:translate-y-0.5' : 'rotate-180 group-hover:-translate-y-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
        {refetching && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Updating…
          </span>
        )}
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="border-y border-gray-200 bg-slate-50/90">
            <tr className="h-11">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">QR Code</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <StudentRow key={s.id} student={s} lastClassIds={lastClassIds} onView={onView} onEdit={onEdit} onDelete={onDelete} onPassedOut={onPassedOut} />
            ))}
          </tbody>
        </table>
      </div>
      {pageSize > 5 && totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs sm:text-sm text-gray-500 tabular-nums">
            Showing <span className="font-medium text-gray-900">{from}</span>–<span className="font-medium text-gray-900">{to}</span> of <span className="font-medium text-gray-900">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => goTo(page - 1)}>
              Previous
            </Button>
            <span className="text-xs text-gray-500 tabular-nums">Page {page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
