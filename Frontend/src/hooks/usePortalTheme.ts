'use client';

import { useEffect, useMemo, useState } from 'react';
import { applyPortalThemeToRoot, clearPortalThemeFromRoot } from '@/lib/theme';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';

/**
 * Org admin portal jaisa hi portal-wide theming: organization ka color root
 * CSS vars par lagta hai (blue + primary scale), taake student/parent portal
 * ke cards, buttons, chips — sab brand color mein aa jayen. Profile aane par
 * caller `setOrgTheme(hex)` bhejta hai; localStorage fallback se flicker nahi.
 */
export function usePortalTheme() {
  const [orgTheme, setOrgTheme] = useState<string | undefined>(getOrgThemeColor);

  useEffect(() => {
    applyPortalThemeToRoot(orgTheme);
    return () => clearPortalThemeFromRoot();
  }, [orgTheme]);

  const pageBg = useMemo(
    () => ({
      backgroundColor: '#f8fafc',
      backgroundImage: `linear-gradient(135deg, #f8fafc 0%, #eef2f7 55%, ${orgTheme ? `${orgTheme}0d` : '#f1f5f9'} 100%)`,
    }),
    [orgTheme]
  );

  return { orgTheme, setOrgTheme, pageBg };
}
