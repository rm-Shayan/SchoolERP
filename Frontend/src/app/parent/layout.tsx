'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@/components/PageLoader';
import { parentService } from '@/lib/api/parentService';
import { portalService } from '@/lib/api/portalService';
import { portalLoginRedirect } from '@/lib/utils/orgTheme';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const hasStudentToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('studentToken'));
    const hasParentToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('parentToken'));

    if (!hasStudentToken && !hasParentToken) {
      router.replace(portalLoginRedirect());
      return;
    }

    const validate = async () => {
      try {
        if (hasStudentToken) {
          await portalService.studentGetMe();
        } else {
          await parentService.getMe();
        }
        setValidated(true);
      } catch {
        if (hasStudentToken) {
          localStorage.removeItem('studentToken');
          localStorage.removeItem('studentProfile');
        } else {
          localStorage.removeItem('parentToken');
          localStorage.removeItem('parentProfile');
        }
        router.replace(portalLoginRedirect());
      }
    };
    validate();
  }, [mounted, router]);

  if (!mounted || !validated) return <PageLoader />;
  return <>{children}</>;
}
