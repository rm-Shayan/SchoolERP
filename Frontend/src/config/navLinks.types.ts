import type { ReactNode } from 'react';
import type { Role } from '@/types';

export interface NavLink {
  label: string;
  path: string;
  icon: ReactNode;
  roles?: Role[];
}

export interface NavGroup {
  title: string;
  icon?: ReactNode;
  links: NavLink[];
}

export type SidebarNavItem = NavLink | NavGroup;
