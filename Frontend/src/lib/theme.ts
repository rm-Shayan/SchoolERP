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

export const PRIMARY_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

/**
 * Apply org theme by setting both --color-primary-* and --theme-primary-* on :root.
 * Inline setProperty on <html> has the highest CSS cascade priority and overrides
 * both @theme (layered) and :root (unlayered) declarations.
 */
export function applyPortalThemeToRoot(themeColor?: string | null): void {
  if (typeof document === 'undefined') return;
  const scale = themeColor ? buildPrimaryScale(themeColor) : null;
  if (!scale) { clearPortalThemeFromRoot(); return; }
  const root = document.documentElement;
  for (const step of PRIMARY_STEPS) {
    root.style.setProperty(`--color-primary-${step}`, scale[step]);
    root.style.setProperty(`--theme-primary-${step}`, scale[step]);
  }
}

export function clearPortalThemeFromRoot(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const step of PRIMARY_STEPS) {
    root.style.removeProperty(`--color-primary-${step}`);
    root.style.removeProperty(`--theme-primary-${step}`);
  }
}

export function applyOrgThemeToRoot(themeColor?: string | null): void {
  applyPortalThemeToRoot(themeColor);
}

export function clearOrgThemeFromRoot(): void {
  clearPortalThemeFromRoot();
}

/**
 * Returns inline CSS custom properties for the wrapper div.
 * Sets --theme-primary-* so the :root bridge in globals.css resolves
 * --color-primary-* via var(--theme-primary-*).
 */
export function orgThemeStyle(themeColor?: string | null): CSSProperties | undefined {
  const scale = themeColor ? buildPrimaryScale(themeColor) : null;
  if (!scale) return undefined;
  const vars: Record<string, string> = {};
  for (const [step, value] of Object.entries(scale)) {
    vars[`--color-primary-${step}`] = value;
    vars[`--theme-primary-${step}`] = value;
  }
  return vars as CSSProperties;
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
  const bg = mix(rgb, 0, 0.42);
  const bgHover = mix(rgb, 0, 0.3);
  const activeBg = `${themeColor}35`;
  const activeAccent = mix(rgb, 255, 0.18);
  return {
    bg, bgHover, activeBg, activeText: '#ffffff', activeAccent,
    text: mix(rgb, 255, 0.82), textMuted: mix(rgb, 255, 0.78),
    textHover: '#ffffff', border: `${activeAccent}30`, groupText: mix(rgb, 255, 0.76),
  };
}
