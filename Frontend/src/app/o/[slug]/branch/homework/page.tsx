import { Suspense } from 'react';
import HomeworkTrackingPage from '@/features/school/components/HomeworkTrackingPage';
import PageLoader from '@/components/PageLoader';

export default function OrgBranchHomeworkPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HomeworkTrackingPage />
    </Suspense>
  );
}
