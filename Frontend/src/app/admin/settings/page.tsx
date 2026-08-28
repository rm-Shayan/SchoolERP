import { Suspense } from 'react';
import SettingsPage from '@/features/superadmin/components/SettingsPage';
import PageLoader from '@/components/PageLoader';

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SettingsPage />
    </Suspense>
  );
}
