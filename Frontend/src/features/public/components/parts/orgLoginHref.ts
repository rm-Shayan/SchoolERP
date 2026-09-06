import type { OrgPublicData } from '@/lib/api/orgService';

/**
 * Org public pages par har "Sign In / Login" link branded login screen par
 * le jaana chahiye: /login?org=<slug>. Single branch ho to school code bhi
 * bhejo taake hub branch-specific branding dikhaye aur code prefill ho.
 */
export function buildOrgLoginHref(org: OrgPublicData): string {
  const params = new URLSearchParams();
  if (org.slug) params.set('org', org.slug);
  if (org.branches.length === 1) params.set('school', org.branches[0].code);
  return params.toString() ? `/login?${params.toString()}` : '/login';
}