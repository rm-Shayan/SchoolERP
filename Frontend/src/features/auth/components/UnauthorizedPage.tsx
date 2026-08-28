'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { getRoleHomePath } from '@/lib/utils';
import { AuthCenteredScreen } from '@/features/shared/components';

const BrandIcon = () => (
  <img src="/screen.png" alt="Logo" className="h-6 w-6 object-contain" />
);

export default function UnauthorizedPage() {
  const { user } = useAppSelector((s) => s.auth);

  return (
    <AuthCenteredScreen brandIcon={<BrandIcon />} brandLabel="SchoolERP" brandSub="Campus Portal">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
      <p className="mt-2 text-sm text-slate-500">You don&apos;t have permission to access this page.</p>
      <Link
        href={getRoleHomePath(user?.role)}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-base font-medium text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Go to Dashboard
      </Link>
    </AuthCenteredScreen>
  );
}
