'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/authSlice';
import DashboardLayout from '@/layouts/DashboardLayout';
import { teacherLinks } from '@/config/navLinks';
import PageLoader from '@/components/PageLoader';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated && typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
      dispatch(loadUser());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'TEACHER') {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, user, mounted, router]);

  if (!mounted || loading) return <PageLoader />;
  if (!isAuthenticated) return <PageLoader />;
  if (user && user.role !== 'TEACHER') return <PageLoader />;

  return (
    <DashboardLayout links={teacherLinks} title="Teacher Portal">
      {children}
    </DashboardLayout>
  );
}
