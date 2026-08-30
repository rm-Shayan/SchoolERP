'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/authSlice';
import { getRoleHomePath } from '@/lib/utils';
import PageLoader from '@/components/PageLoader';

// Har portal ka apna role-set. Isi se decide hota hai kein role is portal
// tak pohunch sakta hai — guard har layout mein reuse hota hai taake ek
// jagah authorization rahe (staff/admin/teacher cross-access na kar saken).
export const PORTAL_ROLES: Record<string, string[]> = {
  admin: ['SUPER_ADMIN'],
  branch: ['ADMIN', 'RECEPTIONIST', 'SUPER_ADMIN'],
  teacher: ['TEACHER'],
};

interface PortalGuardProps {
  portal: 'admin' | 'branch' | 'teacher';
  publicPaths?: string[];
  children: ReactNode;
}

export default function PortalGuard({ portal, publicPaths = [], children }: PortalGuardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, user, organization } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);
  // Track whether we've validated the token — prevents children from mounting
  // and firing API calls with an expired/invalid token.
  const [tokenValidated, setTokenValidated] = useState(false);
  const allowed = PORTAL_ROLES[portal];
  const isPublic = publicPaths.includes(pathname);

  useEffect(() => {
    setMounted(true);
    // ALWAYS validate the token on mount when a stored token exists.
    // hydrateFromStorage may have set isAuthenticated=true from localStorage
    // without actually verifying the token is still valid on the server.
    if (typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
      dispatch(loadUser())
        .unwrap()
        .catch(() => {})
        .finally(() => setTokenValidated(true));
    } else {
      setTokenValidated(true);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!mounted || loading || isPublic) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && !allowed.includes(user.role)) {
      router.replace(getRoleHomePath(user.role, user.organizationId, organization?.slug));
    }
  }, [isAuthenticated, loading, user, mounted, router, isPublic, allowed, organization?.slug]);

  if (isPublic) return <>{children}</>;
  if (!mounted || loading || !tokenValidated) return <PageLoader />;
  if (!isAuthenticated) return <PageLoader />;
  if (user && !allowed.includes(user.role)) return <PageLoader />;

  return <>{children}</>;
}
