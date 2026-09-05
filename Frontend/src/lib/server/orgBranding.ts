import type { ApiResponse, SchoolBranding } from '@/types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

/** Loads public branding without importing the browser-only axios client. */
export async function getServerOrgBranding(slug?: string, code?: string): Promise<SchoolBranding | null> {
  const value = (slug || code || '').trim();
  if (!value) return null;

  const params = new URLSearchParams(slug ? { slug: value } : { code: value });
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/schools/branding?${params.toString()}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ApiResponse<SchoolBranding>;
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Server-side branding resolution for the login page.
 *
 * - `slug`/`code`: organization slug (preferred) or code — used as the
 *   `organization` param so a `school` value is resolved strictly within it.
 * - `school`: optional school/branch code OR name to resolve (scoped to org).
 */
export async function getServerOrgBrandingState(slug?: string, code?: string, school?: string) {
  const orgValue = (slug || code || '').trim();
  const schoolValue = (school || '').trim();

  if (!orgValue) return { status: 'empty' as const, data: null };

  const params = new URLSearchParams();
  params.set('organization', orgValue);
  if (schoolValue) params.set('school', schoolValue);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/schools/branding?${params.toString()}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return { status: 'failed' as const, data: null };
    const payload = (await response.json()) as ApiResponse<SchoolBranding>;
    return payload?.data ? { status: 'ready' as const, data: payload.data } : { status: 'failed' as const, data: null };
  } catch { return { status: 'failed' as const, data: null }; }
}
