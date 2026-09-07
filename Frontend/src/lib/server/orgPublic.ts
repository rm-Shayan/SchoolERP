import type { ApiResponse } from '@/types';
import type { OrgPublicData } from '@/lib/api/orgService';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const REVALIDATE = 300;

export async function getServerOrgPublic(slug: string): Promise<OrgPublicData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/organizations/public/${encodeURIComponent(slug)}`, {
      next: { revalidate: REVALIDATE },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ApiResponse<OrgPublicData>;
    return payload?.data ?? null;
  } catch { return null; }
}

/**
 * All public org slugs — used for generateStaticParams (ISR).
 * If the backend is down at build time, [] is returned → no static pages,
 * only on-demand dynamic rendering continues.
 */
export async function getAllOrgSlugs(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/organizations/public/slugs`, {
      next: { revalidate: REVALIDATE },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as ApiResponse<string[]>;
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch { return []; }
}
