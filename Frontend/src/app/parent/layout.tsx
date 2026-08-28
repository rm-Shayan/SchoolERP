'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PageLoader from '@/components/PageLoader';

// Parent/Student portal alag auth namespace use karta hai (parentToken /
// studentToken), staff/admin/auth.slice se alag. Isliye yahan alag guard
// hai — staff ya teacher (jinke paas parentToken nahi) is portal tak na
// pohonchen, unko /parent/login bhej dete hain.
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isPublic = pathname === '/parent/login';

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasToken = typeof window !== 'undefined'
    && Boolean(localStorage.getItem('parentToken') || localStorage.getItem('studentToken'));

  useEffect(() => {
    if (!mounted || isPublic) return;
    if (!hasToken) router.replace('/parent/login');
  }, [mounted, isPublic, hasToken, router]);

  if (isPublic) return <>{children}</>;
  if (!mounted) return <PageLoader />;
  if (!hasToken) return <PageLoader />;

  return <>{children}</>;
}
