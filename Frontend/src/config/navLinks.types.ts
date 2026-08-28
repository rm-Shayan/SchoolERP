import type { ReactNode } from 'react';

export interface NavLink {
  label: string;
  path: string;
  icon: ReactNode;
}

export interface NavGroup {
  title: string;
  icon?: ReactNode;
  links: NavLink[];
}

export type SidebarNavItem = NavLink | NavGroup;
