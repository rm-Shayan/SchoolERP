'use client';

import { icon, I } from './navIcons';
import type { NavLink, NavGroup, SidebarNavItem } from './navLinks.types';

export type { NavLink, NavGroup, SidebarNavItem } from './navLinks.types';

export const isNavGroup = (item: SidebarNavItem): item is NavGroup =>
  'title' in item && 'links' in item;

export const superAdminLinks: NavLink[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: icon(I.dashboard) },
  { label: 'Organizations', path: '/admin/organizations', icon: icon(I.branches) },
  { label: 'Branches', path: '/admin/branches', icon: icon(I.branches) },
  { label: 'Users', path: '/admin/users', icon: icon(I.staff) },
  { label: 'Import Data', path: '/admin/import', icon: icon(I.upload) },
  { label: 'Activity Log', path: '/admin/activity', icon: icon(I.activity) },
  { label: 'Notifications', path: '/admin/notifications', icon: icon(I.gate) },
  { label: 'Settings', path: '/admin/settings', icon: icon(I.settings) },
];

export const schoolAdminLinks: SidebarNavItem[] = [
  { label: 'Dashboard', path: '/branch/dashboard', icon: icon(I.dashboard) },
  {
    title: 'People',
    icon: icon(I.students),
    links: [
      { label: 'Students', path: '/branch/students', icon: icon(I.students) },
      { label: 'Admissions', path: '/branch/admissions', icon: icon(I.admissions) },
      { label: 'Staff', path: '/branch/staff', icon: icon(I.staff) },
    ],
  },
  {
    title: 'Academics',
    icon: icon(I.academic),
    links: [
      { label: 'Academic Setup', path: '/branch/academic', icon: icon(I.academic) },
      { label: 'Teaching Assignments', path: '/branch/teaching-assignments', icon: icon(I.staff) },
      { label: 'Promotions', path: '/branch/promotions', icon: icon(I.promote) },
      { label: 'Homework', path: '/branch/homework', icon: icon(I.homework) },
      { label: 'Timetable', path: '/branch/timetable', icon: icon(I.timetable) },
      { label: 'PTM', path: '/branch/ptm', icon: icon(I.ptm) },
      { label: 'Conduct Remarks', path: '/branch/conduct', icon: icon(I.conduct) },
    ],
  },
  {
    title: 'Attendance & Leave',
    icon: icon(I.gate),
    links: [
      { label: 'Gate Scanner', path: '/branch/attendance/gate', icon: icon(I.gate) },
      { label: 'Live Attendance', path: '/branch/attendance/live', icon: icon(I.roster) },
      { label: 'Attendance Records', path: '/branch/attendance/records', icon: icon(I.records) },
      { label: 'Leave', path: '/branch/leave', icon: icon(I.leave) },
    ],
  },
  {
    title: 'Finance',
    icon: icon(I.fees),
    links: [
      { label: 'Fee Structures', path: '/branch/fees/structures', icon: icon(I.structures) },
      { label: 'Fee Records', path: '/branch/fees/records', icon: icon(I.records) },
      { label: 'Fee Collection', path: '/branch/fees/collection', icon: icon(I.collect) },
    ],
  },
  {
    title: 'Exams',
    icon: icon(I.exam),
    links: [
      { label: 'Exam Schedule', path: '/branch/exams', icon: icon(I.exam) },
      { label: 'Exam Results', path: '/branch/exams/results', icon: icon(I.exam) },
    ],
  },
  {
    title: 'Communication',
    icon: icon(I.circular),
    links: [
      { label: 'Announcements', path: '/branch/announcements/circulars', icon: icon(I.circular) },
      { label: 'Notifications', path: '/branch/notifications', icon: icon(I.activity) },
    ],
  },
  {
    title: 'Administration',
    icon: icon(I.settings),
    links: [
      { label: 'Import Guide', path: '/branch/import-guide', icon: icon(I.upload) },
      { label: 'Settings', path: '/branch/settings', icon: icon(I.settings) },
    ],
  },
];

export const teacherLinks: NavLink[] = [
  { label: 'Dashboard', path: '/teacher/dashboard', icon: icon(I.dashboard) },
  { label: 'Section Attendance', path: '/teacher/attendance', icon: icon(I.roster) },
  { label: 'My Attendance', path: '/teacher/my-attendance', icon: icon(I.gate) },
  { label: 'My Timetable', path: '/teacher/timetable', icon: icon(I.timetable) },
  { label: 'My PTM', path: '/teacher/ptm', icon: icon(I.ptm) },
  { label: 'Homework', path: '/teacher/homework', icon: icon(I.homework) },
  { label: 'Give Remark', path: '/teacher/conduct', icon: icon(I.conduct) },
  { label: 'Remarks History', path: '/teacher/remarks-history', icon: icon(I.conduct) },
  { label: 'My Leave', path: '/teacher/leave', icon: icon(I.leave) },
  { label: 'Exams', path: '/teacher/exams', icon: icon(I.exam) },
  { label: 'Announcements', path: '/teacher/announcements', icon: icon(I.circular) },
  { label: 'Notifications', path: '/teacher/notifications', icon: icon(I.activity) },
];
