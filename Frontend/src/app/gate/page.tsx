'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import GateScanPage from '@/features/attendance/components/GateScanPage';
import PageLoader from '@/components/PageLoader';

export default function GatePage() {
  const router = useRouter();
  const { isAuthenticated, user, organization } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (organization?.slug) {
      router.replace(`/o/${organization.slug}/gate`);
    }
  }, [organization, mounted, router]);

  if (!mounted) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <GateScanPage />
    </Suspense>
  );
}
