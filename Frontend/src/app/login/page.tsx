import { Suspense } from 'react';
import LoginHubPage from '@/features/auth/components/LoginHubPage';
import LoginHubSkeleton from '@/features/auth/components/parts/LoginHubSkeleton';
import { getServerOrgBrandingState, getServerOrgBranding } from '@/lib/server/orgBranding';

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
  const school = first(sp.school);

  // Primary path: /login?org=oxford[&school=...] — org-scoped resolution.
  let brandingState;
  if (orgSlug || code) {
    brandingState = await getServerOrgBrandingState(orgSlug, code, school);
  } else if (school) {
    // Legacy path: /login?school=CODE alone — resolve the branch by its code.
    const legacy = await getServerOrgBranding(undefined, school);
    brandingState = legacy
      ? { status: 'ready' as const, data: legacy }
      : { status: 'empty' as const, data: null };
  } else {
    brandingState = { status: 'empty' as const, data: null };
  }

  // When branding failed to load, render the default UI instead of crashing.
  const hasData = brandingState.status === 'ready' && !!brandingState.data;

  return (
    <Suspense fallback={<LoginHubSkeleton />}>
      <LoginHubPage
        orgSlug={orgSlug}
        code={code}
        initialBranding={hasData ? brandingState.data : null}
      />
    </Suspense>
  );
}