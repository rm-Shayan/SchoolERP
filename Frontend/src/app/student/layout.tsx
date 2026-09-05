'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@/components/PageLoader';
import { portalService } from '@/lib/api/portalService';
import { portalLoginRedirect } from '@/lib/utils/orgTheme';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('studentToken'));
    if (!hasToken) {
      router.replace(portalLoginRedirect());
      return;
    }

    portalService.studentGetMe()
      .then(() => setValidated(true))
      .catch(() => {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentProfile');
        router.replace(portalLoginRedirect());
      });
  }, [mounted, router]);

  if (!mounted || !validated) return <PageLoader />;
  return <>{children}</>;
}
