import { Card, EmptyState } from '@/features/shared/components';
import type { Student } from '@/types';
import { StudentTable } from './StudentTable';

interface StudentListProps {
  loading: boolean;
  refetching: boolean;
  students: Student[];
  total: number;
  hasFilters: boolean;
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

function SkeletonTable() {
  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-3 w-10 bg-gray-100 rounded animate-pulse hidden sm:block" />
            <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function StudentList({
  loading,
  refetching,
  students,
  total,
  hasFilters,
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
}: StudentListProps) {
  if (loading) return <SkeletonTable />;

  if (total === 0 && hasFilters) {
    return (
      <Card>
        <EmptyState title="No matches" description="Try adjusting your search or filters." />
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card>
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="No students yet"
          description="Students are created through the admissions pipeline — approve an inquiry in the Admissions tab to enroll."
        />
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <EmptyState title="No matches" description="Try adjusting your search or filters." />
      </Card>
    );
  }

  return (
    <StudentTable
      students={students}
      refetching={refetching}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      lastClassIds={lastClassIds}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onPassedOut={onPassedOut}
    />
  );
}
