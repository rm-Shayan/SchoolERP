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
