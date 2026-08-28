import { Suspense } from 'react';
import TeachingAssignmentsPage from '@/features/staff/components/TeachingAssignmentsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchTeachingAssignmentsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TeachingAssignmentsPage />
    </Suspense>
  );
}
