import { Suspense } from 'react';
import PublicAdmissionPage from '@/features/public/components/PublicAdmissionPage';
import PageLoader from '@/components/PageLoader';

export default function OrgAdmissionPageRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PublicAdmissionPage />
    </Suspense>
  );
}
