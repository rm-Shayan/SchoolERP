import { createElement, type ReactNode } from 'react';
import type { CircularAudience } from '@/lib/api/circularService';

export const AUDIENCE_OPTIONS: { value: CircularAudience; label: string; description: string }[] = [
  { value: 'ALL', label: 'Whole School', description: 'Parents and teachers' },
  { value: 'TEACHERS', label: 'Teachers Only', description: 'For teachers and staff' },
  { value: 'PARENTS', label: 'Parents Only', description: 'For all parents' },
];

export const AUDIENCE_LABEL: Record<CircularAudience, string> = {
  ALL: 'Whole School',
  TEACHERS: 'Teachers',
  PARENTS: 'Parents',
};

export const AUDIENCE_BADGE: Record<CircularAudience, 'info' | 'warning' | 'success'> = {
  ALL: 'info',
  TEACHERS: 'warning',
  PARENTS: 'success',
};

const iconPath: Record<CircularAudience, string> = {
  ALL: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  TEACHERS: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  PARENTS: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
};

export const AUDIENCE_ICON: Record<CircularAudience, ReactNode> = Object.fromEntries(
  (Object.keys(iconPath) as CircularAudience[]).map((k) => [
    k,
    createElement(
      'svg',
      { key: k, className: 'h-5 w-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
      createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.6, d: iconPath[k] })
    ),
  ])
) as unknown as Record<CircularAudience, ReactNode>;