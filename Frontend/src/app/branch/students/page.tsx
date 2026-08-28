import { Suspense } from 'react';
import StudentsPage from '@/features/school/components/StudentsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchStudentsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StudentsPage />
    </Suspense>
  );
}
