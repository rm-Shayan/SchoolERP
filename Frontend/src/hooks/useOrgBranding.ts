'use client';

import { useEffect, useState } from 'react';
import { schoolService } from '@/lib/api';
import type { SchoolBranding } from '@/types';

export function useOrgBranding(params?: { code?: string; slug?: string; initialBranding?: SchoolBranding | null }) {
  const code = params?.code;
  const slug = params?.slug;
  const initialBranding = params?.initialBranding;
  const [branding, setBranding] = useState<SchoolBranding | null>(initialBranding ?? null);

  useEffect(() => {
    if (initialBranding) {
      setBranding(initialBranding);
      return;
    }
    if (!code && !slug) {
      setBranding(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const data = await schoolService.getBranding(code ? { code } : { slug: slug! });
        if (alive) setBranding(data);
      } catch {
        // Keep the last successful branding
      }
    })();
    return () => {
      alive = false;
    };
  }, [code, slug, initialBranding]);

  return { branding, setBranding };
}
