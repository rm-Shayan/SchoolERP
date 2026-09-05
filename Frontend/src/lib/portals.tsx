import type { ReactNode } from 'react';

export interface PortalCard {
  href: string;
  title: string;
  description: string;
  badge: string;
  iconBg: string;
  border: string;
  arrow: string;
  glowColor: string;
  icon: ReactNode;
}

export const portals: PortalCard[] = [
  {
    href: '/login',
    title: 'School / Branch Portal',
    description: 'Admins, teachers & receptionists — sign in with your School Code.',
    badge: 'Staff & teachers',
    iconBg: 'bg-secondary-100 text-secondary-700 group-hover:bg-secondary-600 group-hover:text-white',
    border: 'hover:border-secondary-300',
    arrow: 'group-hover:text-secondary-600',
    glowColor: 'rgba(34,197,94,0.12)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/login',
    title: 'Parent & Student Portal',
    description: 'Parents & students sign in on the unified login with School Code + school password to track attendance, fees, homework & notices.',
    badge: 'School Password',
    iconBg: 'bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white',
    border: 'hover:border-amber-300',
    arrow: 'group-hover:text-amber-600',
    glowColor: 'rgba(245,158,11,0.12)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    href: '/admin/login',
    title: 'Platform Admin Console',
    description: 'Super Admins provisioning and managing every school & organization.',
    badge: 'Super admin only',
    iconBg: 'bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white',
    border: 'hover:border-primary-300',
    arrow: 'group-hover:text-primary-600',
    glowColor: 'rgba(59,130,246,0.12)',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];
