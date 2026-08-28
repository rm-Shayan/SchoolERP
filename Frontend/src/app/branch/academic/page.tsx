import { Suspense } from 'react';
import AcademicSetupPage from '@/features/academic/components/AcademicSetupPage';
import PageLoader from '@/components/PageLoader';

export default function BranchAcademicPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AcademicSetupPage />
    </Suspense>
  );
}
