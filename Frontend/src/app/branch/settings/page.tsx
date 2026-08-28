import { Suspense } from 'react';
import SettingsPage from '@/features/school/components/SettingsPage';
import PageLoader from '@/components/PageLoader';

export default function BranchSettingsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SettingsPage />
    </Suspense>
  );
}
