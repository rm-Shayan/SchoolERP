import { Suspense } from 'react';
import ForgotPasswordPage from '@/features/auth/components/ForgotPasswordPage';
import LoginHubSkeleton from '@/features/auth/components/parts/LoginHubSkeleton';
import { getServerOrgBrandingState } from '@/lib/server/orgBranding';

interface ForgotPasswordPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ForgotPasswordPageRoute({ searchParams }: ForgotPasswordPageProps) {
  const sp = await searchParams;
  const orgSlug = first(sp.org);
  const code = first(sp.code);
  const school = first(sp.school);

  let branding = null;
  if (orgSlug || code) {
    const state = await getServerOrgBrandingState(orgSlug, code, school);
    if (state.status === 'ready') branding = state.data;
  }

  return (
    <Suspense fallback={<LoginHubSkeleton />}>
      <ForgotPasswordPage branding={branding} />
    </Suspense>
  );
}