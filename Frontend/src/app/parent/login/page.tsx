import ParentLoginPage from '@/features/parent/components/ParentLoginPage';

interface ParentLoginPageRouteProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ParentLoginPageRoute({ searchParams }: ParentLoginPageRouteProps) {
  const sp = await searchParams;
  return <ParentLoginPage code={first(sp.code)} orgSlug={first(sp.org)} />;
}
