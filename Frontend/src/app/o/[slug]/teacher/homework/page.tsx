import { Suspense } from 'react';
import HomeworkPage from '@/features/teacher/components/HomeworkPage';
import PageLoader from '@/components/PageLoader';

export default function TeacherHomeworkPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HomeworkPage />
    </Suspense>
  );
}
