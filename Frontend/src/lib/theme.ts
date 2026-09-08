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

const THEME_STYLE_ID = 'org-dynamic-theme';

function injectThemeStyle(css: string): void {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = THEME_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function removeThemeStyle(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(THEME_STYLE_ID);
  if (el) el.remove();
}

function buildThemeCss(scale: Record<string, string>, selectors: string): string {
  const vars = PRIMARY_STEPS.map(
    (step) => `  --color-primary-${step}: ${scale[step]};`
  ).join('\n');
  return `${selectors} {\n${vars}\n}`;
}

function buildBlueThemeCss(scale: Record<string, string>, selectors: string): string {
  const vars = PRIMARY_STEPS.map(
    (step) => `  --color-primary-${step}: ${scale[step]};\n  --color-blue-${step}: ${scale[step]};`
  ).join('\n');
  return `${selectors} {\n${vars}\n}`;
}

/**
 * Apply org theme to :root via injected <style> tag with !important.
 * This guarantees override of Tailwind v4's @theme block at every layer.
 * Used by org admin portal (DashboardLayout).
 */
export function applyOrgThemeToRoot(themeColor?: string | null): void {
  if (typeof document === 'undefined') return;
  const scale = themeColor ? buildPrimaryScale(themeColor) : null;
  if (!scale) { clearOrgThemeFromRoot(); return; }
  injectThemeStyle(buildThemeCss(scale, ':root'));
}

export function clearOrgThemeFromRoot(): void {
  removeThemeStyle();
}

/**
 * Portal theming — overrides both --color-primary-* and --color-blue-* via
 * injected <style> with !important, guaranteeing Tailwind v4 @theme override.
 */
export function applyPortalThemeToRoot(themeColor?: string | null): void {
  if (typeof document === 'undefined') return;
  const scale = themeColor ? buildPrimaryScale(themeColor) : null;
  if (!scale) { clearPortalThemeFromRoot(); return; }
  injectThemeStyle(buildBlueThemeCss(scale, ':root'));
}

export function clearPortalThemeFromRoot(): void {
  removeThemeStyle();
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
    bg,
    bgHover,
    activeBg,
    activeText: '#ffffff',
    activeAccent,
    text: mix(rgb, 255, 0.82),
    textMuted: mix(rgb, 255, 0.78),
    textHover: '#ffffff',
    border: `${activeAccent}30`,
    groupText: mix(rgb, 255, 0.76),
  };
}
