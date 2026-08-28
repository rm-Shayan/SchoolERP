import { Suspense } from 'react';
import TeacherExamsPage from '@/features/exams/components/TeacherExamsPage';
import PageLoader from '@/components/PageLoader';

export default function TeacherExamsPageWrapper() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TeacherExamsPage />
    </Suspense>
  );
}
