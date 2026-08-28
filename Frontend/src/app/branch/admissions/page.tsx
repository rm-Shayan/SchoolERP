import { Suspense } from 'react';
import AdmissionsPage from '@/features/admissions/components/AdmissionsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchAdmissionsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdmissionsPage />
    </Suspense>
  );
}
