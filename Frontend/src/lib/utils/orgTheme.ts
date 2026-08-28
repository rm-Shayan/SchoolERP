/**
 * Org theme helper — reads themeColor from localStorage (set on login).
 * Returns a hex color string (e.g. "#2563eb") or undefined.
 */
export function getOrgThemeColor(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const orgStr = localStorage.getItem('organization');
    if (!orgStr) return undefined;
    const org = JSON.parse(orgStr);
    return org?.themeColor || undefined;
  } catch {
    return undefined;
  }
}

/** Convert hex to RGB triplet (no #). */
export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Returns Tailwind-compatible CSS custom properties for the theme color. */
export function themeVars(hex?: string) {
  if (!hex) return {};
  return {
    '--theme': hex,
    '--theme-rgb': hexToRgb(hex),
  } as React.CSSProperties;
}

/** Returns common Tailwind classes for the theme color. */
export function themeClasses(hex?: string) {
  if (!hex) return { solid: 'bg-primary-600 text-white', outline: 'border-primary-600 text-primary-700', soft: 'bg-primary-50 text-primary-700', ring: 'ring-primary-500' };
  return { solid: 'text-white', outline: `border-[${hex}]`, soft: '', ring: '' };
}
