'use client';

import { useEffect } from 'react';
import { applyPortalThemeToRoot } from '@/lib/theme';
import { getPortalThemeColor } from '@/lib/utils/orgTheme';

/**
 * Global theme synchronizer — runs once at app root.
 * 1. On boot: applies the active portal theme (branch school.themeColor,
 *    falling back to organization.themeColor) from localStorage to :root so
 *    every portal is themed even before its own layout effect runs.
 * 2. Live: re-applies whenever settings save fires `org-theme-changed`
 *    (same tab) or the `organization`/`school` key changes (other tabs).
 */
export default function ThemeSync() {
  useEffect(() => {
    const apply = () => applyPortalThemeToRoot(getPortalThemeColor() || null);

    apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'organization' || e.key === 'school') apply();
    };
    const onThemeChanged = () => apply();
    window.addEventListener('storage', onStorage);
    window.addEventListener('org-theme-changed', onThemeChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('org-theme-changed', onThemeChanged);
    };
  }, []);

  return null;
}
