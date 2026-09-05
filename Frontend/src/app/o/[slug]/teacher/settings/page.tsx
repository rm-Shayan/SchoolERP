import { Suspense } from 'react';
import SettingsPage from '@/features/teacher/components/SettingsPage';
import PageLoader from '@/components/PageLoader';

export default function TeacherSettingsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SettingsPage />
    </Suspense>
  );
}
