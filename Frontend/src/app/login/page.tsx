import { Suspense } from 'react';
import LoginHubPage from '@/features/auth/components/LoginHubPage';
import LoginHubSkeleton from '@/features/auth/components/parts/LoginHubSkeleton';
import { getServerOrgBrandingState } from '@/lib/server/orgBranding';

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const orgSlug = first(sp.org);
  const code = first(sp.code);
  const brandingState = await getServerOrgBrandingState(orgSlug, code);

  return (
    <Suspense fallback={<LoginHubSkeleton />}>
      <LoginHubPage orgSlug={orgSlug} code={code} initialBranding={brandingState.data} />
    </Suspense>
  );
}
