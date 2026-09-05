import { Suspense } from 'react';
import StudyMaterialPage from '@/features/teacher/components/StudyMaterialPage';
import PageLoader from '@/components/PageLoader';

export default function OrgTeacherStudyMaterialPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StudyMaterialPage />
    </Suspense>
  );
}
