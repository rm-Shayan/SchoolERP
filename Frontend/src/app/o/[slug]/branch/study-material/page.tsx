import { Suspense } from 'react';
import StudyMaterialPage from '@/features/school/components/StudyMaterialPage';
import PageLoader from '@/components/PageLoader';

export default function OrgBranchStudyMaterialPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StudyMaterialPage />
    </Suspense>
  );
}
