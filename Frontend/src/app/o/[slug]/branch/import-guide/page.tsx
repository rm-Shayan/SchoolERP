import { Suspense } from 'react';
import ImportGuidePage from '@/features/school/components/ImportGuidePage';
import PageLoader from '@/components/PageLoader';

export default function BranchImportGuidePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ImportGuidePage />
    </Suspense>
  );
}
