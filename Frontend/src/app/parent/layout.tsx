'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PageLoader from '@/components/PageLoader';
import { parentService } from '@/lib/api/parentService';
import { portalService } from '@/lib/api/portalService';

// Parent/Student portal alag auth namespace use karta hai (parentToken /
// studentToken), staff/admin/auth.slice se alag. Isliye yahan alag guard
// hai — staff ya teacher (jinke paas parentToken nahi) is portal tak na
// pohonchen, unko /parent/login bhej dete hain.
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [validated, setValidated] = useState(false);
  const isPublic = pathname === '/parent/login';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate token on mount — don't just trust localStorage.
  useEffect(() => {
    if (!mounted || isPublic) return;

    const hasStudentToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('studentToken'));
    const hasParentToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('parentToken'));

    if (!hasStudentToken && !hasParentToken) {
      router.replace('/parent/login');
      return;
    }

    // Verify the token is still valid on the server
    const validate = async () => {
      try {
        if (hasStudentToken) {
          await portalService.studentGetMe();
        } else {
          await parentService.getMe();
        }
        setValidated(true);
      } catch {
        // Token expired or invalid — clear and redirect
        if (hasStudentToken) {
          localStorage.removeItem('studentToken');
          localStorage.removeItem('studentProfile');
        } else {
          localStorage.removeItem('parentToken');
          localStorage.removeItem('parentProfile');
        }
        router.replace('/parent/login');
      }
    };
    validate();
  }, [mounted, isPublic, router]);

  if (isPublic) return <>{children}</>;
  if (!mounted || !validated) return <PageLoader />;

  return <>{children}</>;
}
