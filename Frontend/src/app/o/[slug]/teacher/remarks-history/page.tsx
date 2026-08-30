import { Suspense } from 'react';
import RemarksHistoryPage from '@/features/teacher/components/RemarksHistoryPage';
import PageLoader from '@/components/PageLoader';

export default function TeacherRemarksHistoryPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RemarksHistoryPage />
    </Suspense>
  );
}
