'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/authSlice';
import DashboardLayout from '@/layouts/DashboardLayout';
import { schoolAdminLinks } from '@/config/navLinks';
import PageLoader from '@/components/PageLoader';

interface BranchLayoutProps {
  children: React.ReactNode;
}

export default function BranchLayout({ children }: BranchLayoutProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const { isAuthenticated, loading, user } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Always refresh user data on mount — ensures org themeColor and
    // other org fields are current (localStorage may be stale).
    if (typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && !['ADMIN', 'RECEPTIONIST', 'SUPER_ADMIN'].includes(user.role)) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, user, mounted, router]);

  if (!mounted || loading) return <PageLoader />;
  if (!isAuthenticated) return <PageLoader />;

  const allowedRoles = ['ADMIN', 'RECEPTIONIST', 'SUPER_ADMIN'];
  if (user && !allowedRoles.includes(user.role)) {
    return <PageLoader />;
  }

  return (
    <DashboardLayout links={schoolAdminLinks} title="Branch Admin">
      {children}
    </DashboardLayout>
  );
}
