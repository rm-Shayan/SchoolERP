'use client';

import { icon, I } from './navIcons';
import type { NavLink, NavGroup, SidebarNavItem } from './navLinks.types';
import type { Role } from '@/types';

export type { NavLink, NavGroup, SidebarNavItem } from './navLinks.types';

export const isNavGroup = (item: SidebarNavItem): item is NavGroup =>
  'title' in item && 'links' in item;

export function filterLinksByRole(links: SidebarNavItem[], role?: Role | null): SidebarNavItem[] {
  if (!role) return links;
  return links
    .map((item) => {
      if (!isNavGroup(item)) {
        return item.roles && !item.roles.includes(role) ? null : item;
      }
      const filtered = item.links.filter((l) => !l.roles || l.roles.includes(role));
      if (filtered.length === 0) return null;
      return { ...item, links: filtered };
    })
    .filter(Boolean) as SidebarNavItem[];
}

export const superAdminLinks: NavLink[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: icon(I.home) },
  { label: 'Organizations', path: '/admin/organizations', icon: icon(I.buildingOffice2) },
  { label: 'Branches', path: '/admin/branches', icon: icon(I.buildingLibrary) },
  { label: 'Users', path: '/admin/users', icon: icon(I.usersTwo) },
  { label: 'School Health', path: '/admin/health', icon: icon(I.heart) },
  { label: 'Import Data', path: '/admin/import', icon: icon(I.upload) },
  { label: 'Activity Log', path: '/admin/activity', icon: icon(I.clock) },
  { label: 'Notifications', path: '/admin/notifications', icon: icon(I.bell) },
  { label: 'Settings', path: '/admin/settings', icon: icon(I.gear) },
];

export const schoolAdminLinks: SidebarNavItem[] = [
  { label: 'Dashboard', path: '/branch/dashboard', icon: icon(I.home) },
  {
    title: 'People',
    links: [
      { label: 'Students', path: '/branch/students', icon: icon(I.academicCap) },
      { label: 'Admissions', path: '/branch/admissions', icon: icon(I.userPlus) },
      { label: 'Staff', path: '/branch/staff', icon: icon(I.briefcase), roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },
  {
    title: 'Academics',
    links: [
      { label: 'Academic Setup', path: '/branch/academic', icon: icon(I.wrench), roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Teaching Assignments', path: '/branch/teaching-assignments', icon: icon(I.clipboardList), roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Promotions', path: '/branch/promotions', icon: icon(I.trendUp), roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Homework', path: '/branch/homework', icon: icon(I.pencilSquare), roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Study Materials', path: '/branch/study-material', icon: icon(I.folderOpen) },
      { label: 'Timetable', path: '/branch/timetable', icon: icon(I.calendar), roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'PTM', path: '/branch/ptm', icon: icon(I.chatBubble) },
      { label: 'Conduct Remarks', path: '/branch/conduct', icon: icon(I.shieldCheck), roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },
  {
    title: 'Attendance & Leave',
    links: [
      { label: 'Gate Scanner', path: '/branch/attendance/gate', icon: icon(I.qr) },
      { label: 'Live Attendance', path: '/branch/attendance/live', icon: icon(I.checkCircle) },
      { label: 'Attendance Records', path: '/branch/attendance/records', icon: icon(I.documentCheck) },
      { label: 'Leave', path: '/branch/leave', icon: icon(I.paperPlane), roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },
  {
    title: 'Finance',
    links: [
      { label: 'Fee Structures', path: '/branch/fees/structures', icon: icon(I.tag), roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Fee Records', path: '/branch/fees/records', icon: icon(I.banknotes), roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Fee Collection', path: '/branch/fees/collection', icon: icon(I.wallet) },
    ],
  },
  {
    title: 'Exams',
    links: [
      { label: 'Exam Schedule', path: '/branch/exams', icon: icon(I.listBullet), roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Exam Results', path: '/branch/exams/results', icon: icon(I.chartBarSquare), roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },
  {
    title: 'Communication',
    links: [
      { label: 'Announcements', path: '/branch/announcements/circulars', icon: icon(I.megaphone) },
      { label: 'Notifications', path: '/branch/notifications', icon: icon(I.bell) },
    ],
  },
  {
    title: 'Administration',
    links: [
      { label: 'Import Guide', path: '/branch/import-guide', icon: icon(I.upload), roles: ['ADMIN', 'SUPER_ADMIN'] },
      { label: 'Settings', path: '/branch/settings', icon: icon(I.sliders), roles: ['ADMIN', 'SUPER_ADMIN'] },
    ],
  },
];

export const teacherLinks: NavLink[] = [
  { label: 'Dashboard', path: '/teacher/dashboard', icon: icon(I.home) },
  { label: 'My Students', path: '/teacher/students', icon: icon(I.academicCap) },
  { label: 'Section Attendance', path: '/teacher/attendance', icon: icon(I.clipboardCheck) },
  { label: 'My Attendance', path: '/teacher/my-attendance', icon: icon(I.clock) },
  { label: 'My Timetable', path: '/teacher/timetable', icon: icon(I.calendar) },
  { label: 'My PTM', path: '/teacher/ptm', icon: icon(I.chatBubble) },
  { label: 'Homework', path: '/teacher/homework', icon: icon(I.pencilSquare) },
  { label: 'Study Materials', path: '/teacher/study-material', icon: icon(I.folderOpen) },
  { label: 'Give Remark', path: '/teacher/conduct', icon: icon(I.shieldCheck) },
  { label: 'My Leave', path: '/teacher/leave', icon: icon(I.paperPlane) },
  { label: 'Exams', path: '/teacher/exams', icon: icon(I.documentText) },
  { label: 'Announcements', path: '/teacher/announcements', icon: icon(I.megaphone) },
  { label: 'Notifications', path: '/teacher/notifications', icon: icon(I.bell) },
  { label: 'Settings', path: '/teacher/settings', icon: icon(I.gear) },
];

export const receptionistLinks: SidebarNavItem[] = [
  { label: 'Dashboard', path: '/branch/dashboard', icon: icon(I.home) },
  {
    title: 'Front Desk',
    links: [
      { label: 'Students', path: '/branch/students', icon: icon(I.academicCap) },
      { label: 'Admissions', path: '/branch/admissions', icon: icon(I.userPlus) },
    ],
  },
  {
    title: 'Finance',
    links: [
      { label: 'Fee Collection', path: '/branch/fees/collection', icon: icon(I.wallet) },
      { label: 'Fee Records', path: '/branch/fees/records', icon: icon(I.banknotes) },
    ],
  },
  {
    title: 'Attendance',
    links: [
      { label: 'Gate Scanner', path: '/branch/attendance/gate', icon: icon(I.qr) },
      { label: 'Live Attendance', path: '/branch/attendance/live', icon: icon(I.checkCircle) },
      { label: 'Attendance Records', path: '/branch/attendance/records', icon: icon(I.documentCheck) },
    ],
  },
  {
    title: 'Academics',
    links: [
      { label: 'Exam Results', path: '/branch/exams/results', icon: icon(I.chartBarSquare) },
      { label: 'Study Materials', path: '/branch/study-material', icon: icon(I.folderOpen) },
      { label: 'PTM', path: '/branch/ptm', icon: icon(I.chatBubble) },
    ],
  },
  {
    title: 'Communication',
    links: [
      { label: 'Announcements', path: '/branch/announcements/circulars', icon: icon(I.megaphone) },
      { label: 'Notifications', path: '/branch/notifications', icon: icon(I.bell) },
    ],
  },
];
