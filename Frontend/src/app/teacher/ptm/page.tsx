import { Suspense } from 'react';
import TeacherPTMPage from '@/features/teacher/components/TeacherPTMPage';
import PageLoader from '@/components/PageLoader';

export default function TeacherPTMRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TeacherPTMPage />
    </Suspense>
  );
}
