import { redirect } from 'next/navigation';

interface ParentLoginRedirectProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Parent/student login ab unified /login hub par hai (staff + parent + student).
 * Purana dedicated screen hata diya — yahan aane wale ko org slug ke saath /login par bhejo.
 */
export default async function ParentLoginRedirect({ searchParams }: ParentLoginRedirectProps) {
  const sp = await searchParams;
  const org = first(sp.org);
  const code = first(sp.code);
  const params = new URLSearchParams();
  if (org) params.set('org', org);
  if (code) params.set('code', code);
  const qs = params.toString();
  redirect(qs ? `/login?${qs}` : '/login');
}
