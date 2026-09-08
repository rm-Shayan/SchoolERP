'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { schoolService } from '@/lib/api';
import { applyPortalThemeToRoot, clearPortalThemeFromRoot } from '@/lib/theme';
import GateScanPage from '@/features/attendance/components/GateScanPage';

export default function GatePageWrapper() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!slug) { setReady(true); return; }
    let alive = true;
    (async () => {
      try {
        const branding = await schoolService.getBranding({ slug });
        if (alive && branding?.themeColor) {
          applyPortalThemeToRoot(branding.themeColor);
        }
      } catch { /* use default */ }
      if (alive) setReady(true);
    })();
    return () => { alive = false; clearPortalThemeFromRoot(); };
  }, [slug]);

  if (!ready) return null;
  return <GateScanPage />;
}
