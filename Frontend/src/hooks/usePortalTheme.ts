'use client';

import { useEffect, useMemo, useState } from 'react';
import { applyPortalThemeToRoot, clearPortalThemeFromRoot } from '@/lib/theme';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';

/**
 * Portal-wide theming just like the org admin portal: the organization's color
 * is applied to root CSS vars (blue + primary scale), so the student/parent
 * portal's cards, buttons, chips — everything matches the brand color.
 * The caller passes `setOrgTheme(hex)` when the profile loads; localStorage
 * fallback prevents flicker.
 */
export function usePortalTheme() {
  const [orgTheme, setOrgTheme] = useState<string | undefined>(() => {
    const v = getOrgThemeColor();
    console.log('[ThemeTrace] usePortalTheme useState init — getOrgThemeColor():', v);
    return v;
  });

  useEffect(() => {
    console.log('[ThemeTrace] usePortalTheme useEffect — applying:', orgTheme);
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
