'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import PageLoader from '@/components/PageLoader';
import GateScanPage from '@/features/attendance/components/GateScanPage';

export default function GatePage() {
  const router = useRouter();
  const { organization } = useAppSelector((s) => s.auth);
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

  return <GateScanPage />;
}
