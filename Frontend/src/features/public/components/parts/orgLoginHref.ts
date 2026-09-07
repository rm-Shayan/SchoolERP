import type { OrgPublicData } from '@/lib/api/orgService';

/**
 * Every "Sign In / Login" link on the org's public pages should point to the
 * branded login screen: /login?org=<slug>. If there is a single branch, also
 * include the school code so the hub shows branch-specific branding and
 * pre-fills the code.
 */
export function buildOrgLoginHref(org: OrgPublicData): string {
  const params = new URLSearchParams();
  if (org.slug) params.set('org', org.slug);
  if (org.branches.length === 1) params.set('school', org.branches[0].code);
  return params.toString() ? `/login?${params.toString()}` : '/login';
}