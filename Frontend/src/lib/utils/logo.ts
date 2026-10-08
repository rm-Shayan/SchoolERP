import type { SyntheticEvent } from 'react';

/**
 * Resolve the best available logo URL with fallback chain:
 *   branch (school) logo → organization logo → null (initials fallback in Logo component)
 *
 * @param schoolLogo  - Branch/school logoUrl
 * @param orgLogo     - Organization logoUrl
 * @returns The first truthy logo URL, or null (Logo component shows initials)
 */
export function resolveLogoUrl(
  schoolLogo?: string | null,
  orgLogo?: string | null,
): string | null {
  return schoolLogo || orgLogo || null;
}

/**
 * Organization-first chain (sidebar top box, org-only contexts):
 *   organization logo → branch (school) logo → null
 */
export function resolveOrgLogoUrl(
  orgLogo?: string | null,
  schoolLogo?: string | null,
): string | null {
  return orgLogo || schoolLogo || null;
}

/**
 * onError handler for logo <img> tags — swaps a broken/missing logo URL for
 * the platform logo exactly once (guarded so a broken platform asset cannot
 * loop). Usage: <img src={logo} onError={platformLogoFallback} />
 */
export function platformLogoFallback(e: SyntheticEvent<HTMLImageElement>): void {
  const el = e.currentTarget;
  if (el.dataset.logoFallback) return;
  el.dataset.logoFallback = '1';
  el.src = '/screen.png';
}
