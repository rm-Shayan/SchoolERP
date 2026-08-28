'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/authSlice';
import { getRoleHomePath } from '@/lib/utils';
import { AuthCenteredScreen, Loading } from '@/features/shared/components';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const BrandIcon = () => (
  <img src="/screen.png" alt="Logo" className="h-6 w-6 object-contain" />
);

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, user, organization } = useAppSelector((s) => s.auth);
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
      router.replace(`/login`);
    }
  }, [isAuthenticated, loading, mounted, router]);

  if (!mounted || loading) {
    return (
      <AuthCenteredScreen brandIcon={<BrandIcon />} brandLabel="SchoolERP" brandSub="Campus Portal">
        <Loading className="py-2" />
        <h1 className="text-xl font-bold text-slate-900">Loading your workspace</h1>
        <p className="mt-2 text-sm text-slate-500">Just a moment while we verify your session.</p>
      </AuthCenteredScreen>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    router.replace(getRoleHomePath(user.role, user.organizationId, organization?.slug));
    return null;
  }

  return <>{children}</>;
}
