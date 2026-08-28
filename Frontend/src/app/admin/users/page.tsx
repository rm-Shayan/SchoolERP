import { Suspense } from 'react';
import UsersPage from '@/features/superadmin/components/UsersPage';
import PageLoader from '@/components/PageLoader';

export default function UsersPageRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <UsersPage />
    </Suspense>
  );
}
