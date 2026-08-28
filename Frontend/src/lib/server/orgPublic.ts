import type { ApiResponse } from '@/types';
import type { OrgPublicData } from '@/lib/api/orgService';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function getServerOrgPublic(slug: string): Promise<OrgPublicData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/organizations/public/${encodeURIComponent(slug)}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const payload = (await response.json()) as ApiResponse<OrgPublicData>;
    return payload?.data ?? null;
  } catch { return null; }
}
