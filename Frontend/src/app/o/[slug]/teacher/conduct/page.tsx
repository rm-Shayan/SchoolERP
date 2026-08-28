import { Suspense } from 'react';
import ConductRemarksPage from '@/features/teacher/components/ConductRemarksPage';
import PageLoader from '@/components/PageLoader';

export default function TeacherConductPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ConductRemarksPage />
    </Suspense>
  );
}
