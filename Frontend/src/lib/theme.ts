'use client';

import type { CSSProperties } from 'react';

const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function mix(rgb: [number, number, number], target: number, ratio: number): string {
  const [r, g, b] = rgb;
  const toHex = (c: number) => clamp(c + (target - c) * ratio).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHex(hex: string, target: number, ratio: number): string {
  const rgb = hexToRgb(hex);
  return rgb ? mix(rgb, target, ratio) : hex;
}

export function buildPrimaryScale(hex: string): Record<string, string> | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return {
    '50': mix(rgb, 255, 0.95), '100': mix(rgb, 255, 0.88),
    '200': mix(rgb, 255, 0.75), '300': mix(rgb, 255, 0.58),
    '400': mix(rgb, 255, 0.38), '500': mix(rgb, 255, 0.16),
    '600': mix(rgb, 255, 0),    '700': mix(rgb, 0, 0.14),
    '800': mix(rgb, 0, 0.26),  '900': mix(rgb, 0, 0.38),
    '950': mix(rgb, 0, 0.5),
  };
}

export function orgThemeStyle(themeColor?: string | null): CSSProperties | undefined {
  const scale = themeColor ? buildPrimaryScale(themeColor) : null;
  if (!scale) return undefined;
  const vars: Record<string, string> = {};
  for (const [step, value] of Object.entries(scale)) {
    vars[`--color-primary-${step}`] = value;
  }
  return vars as CSSProperties;
}

export const PRIMARY_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

/**
 * Org theme ko <html> (:root) par set karo — taake sirf layout wrapper nahi,
 * BALKE har component (modals, dropdowns, portals, sab) themed ho.
 * DashboardLayout ke effect se call hota hai; null/invalid color par overrides
 * clear ho jate hain (default violet wapas).
 */
export function applyOrgThemeToRoot(themeColor?: string | null): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  const scale = themeColor ? buildPrimaryScale(themeColor) : null;
  if (!scale) {
    clearOrgThemeFromRoot();
    return;
  }
  for (const step of PRIMARY_STEPS) {
    root.setProperty(`--color-primary-${step}`, scale[step]);
  }
}

export function clearOrgThemeFromRoot(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  for (const step of PRIMARY_STEPS) {
    root.removeProperty(`--color-primary-${step}`);
  }
}

export interface SidebarColors {
  bg: string;
  bgHover: string;
  activeBg: string;
  activeText: string;
  activeAccent: string;
  text: string;
  textMuted: string;
  textHover: string;
  border: string;
  groupText: string;
}

const DEFAULT_SIDEBAR: SidebarColors = {
  bg: '#0f172a', bgHover: '#1e293b', activeBg: 'rgba(99,102,241,0.15)',
  activeText: '#ffffff', activeAccent: '#818cf8', text: '#94a3b8',
  textMuted: '#cbd5e1', textHover: '#ffffff', border: 'rgba(255,255,255,0.08)',
  groupText: '#94a3b8',
};

export function sidebarColors(themeColor?: string | null): SidebarColors {
  if (!themeColor) return DEFAULT_SIDEBAR;
  const rgb = hexToRgb(themeColor);
  if (!rgb) return DEFAULT_SIDEBAR;
  // Darken the theme color just enough for white text readability,
  // but keep it clearly tinted so the org brand is unmistakable.
  const bg = mix(rgb, 0, 0.42);
  const bgHover = mix(rgb, 0, 0.3);
  const activeBg = `${themeColor}35`;
  const activeAccent = mix(rgb, 255, 0.18);
  return {
    bg,
    bgHover,
    activeBg,
    activeText: '#ffffff',
    activeAccent,
    // Bright, readable text on the tinted themed background — group headers
    // and dropdown items must stay clearly visible.
    text: mix(rgb, 255, 0.82),
    textMuted: mix(rgb, 255, 0.78),
    textHover: '#ffffff',
    border: `${activeAccent}30`,
    groupText: mix(rgb, 255, 0.76),
  };
}
