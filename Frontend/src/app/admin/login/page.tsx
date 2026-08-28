import { Suspense } from 'react';
import SuperAdminLoginPage from '@/features/auth/components/SuperAdminLoginPage';
import LoginHubSkeleton from '@/features/auth/components/parts/LoginHubSkeleton';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginHubSkeleton />}>
      <SuperAdminLoginPage />
    </Suspense>
  );
}
