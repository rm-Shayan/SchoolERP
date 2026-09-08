import type { AuthVariant } from '@/features/shared/components';

export type RoleKey = 'staff' | 'teacher' | 'admin' | 'parent' | 'student';

export interface RoleOption {
  key: RoleKey;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  variant: AuthVariant;
  loginTitle: string;
  loginNote: string;
  panel: { badge: string; heading: string; description: string; features: string[] };
  card: { iconBox: string; border: string; arrow: string };
  chip: string;
}

export const ROLES: RoleOption[] = [
  {
    key: 'staff',
    title: 'School Admin & Staff',
    subtitle: 'Principals & receptionists.',
    badge: 'School Code',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    variant: 'primary',
    loginTitle: 'Staff Portal',
    loginNote: '',
    panel: {
      badge: 'Branch office',
      heading: 'Run your campus operations.',
      description: 'Manage students, admissions, fees, staff and everyday school work from one dashboard.',
      features: ['Student records', 'Admissions & fees', 'Gate attendance', 'Live reports'],
    },
    card: {
      iconBox: 'bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white',
      border: 'hover:border-primary-300',
      arrow: 'group-hover:text-primary-600',
    },
    chip: 'bg-primary-100 text-primary-700',
  },
  {
    key: 'teacher',
    title: 'Teacher',
    subtitle: 'Attendance, homework, conduct & timetable.',
    badge: 'School Code',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    variant: 'primary',
    loginTitle: 'Teacher Sign In',
    loginNote: 'Sign in with your school code and the credentials shared by the office.',
    panel: {
      badge: 'Teacher portal',
      heading: 'Focus on your classroom.',
      description: 'Take attendance, post homework, record conduct remarks and view your timetable.',
      features: ['Section attendance', 'Homework posts', 'Conduct remarks', 'Timetable'],
    },
    card: {
      iconBox: 'bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white',
      border: 'hover:border-primary-300',
      arrow: 'group-hover:text-primary-600',
    },
    chip: 'bg-primary-100 text-primary-700',
  },
  {
    key: 'admin',
    title: 'Platform Admin',
    subtitle: 'Platform owner — every organization & branch.',
    badge: 'Admin console',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
    variant: 'superadmin',
    loginTitle: 'Platform Admin',
    loginNote: 'Super admins sign in with email and password.',
    panel: {
      badge: 'Super admin only',
      heading: 'Control every school from one place.',
      description: 'Manage organizations, branches, users, imports and platform analytics.',
      features: ['Organizations', 'School setup', 'System analytics', 'Secure access'],
    },
    card: {
      iconBox: 'bg-violet-100 text-violet-700 group-hover:bg-violet-600 group-hover:text-white',
      border: 'hover:border-violet-300',
      arrow: 'group-hover:text-violet-600',
    },
    chip: 'bg-violet-100 text-violet-700',
  },
  {
    key: 'parent',
    title: 'Parent',
    subtitle: 'Attendance, fees, homework & notices.',
    badge: 'Email OTP',
    icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
    variant: 'secondary',
    loginTitle: 'Parent Portal',
    loginNote: 'Passwordless — verify with an Email OTP.',
    panel: {
      badge: 'Email OTP',
      heading: 'Stay close to your child\u2019s school day.',
      description: 'Track attendance, fee status, homework and notices without remembering passwords.',
      features: ['Fee & attendance', 'Homework & notices', 'No passwords', 'Instant OTP'],
    },
    card: {
      iconBox: 'bg-secondary-100 text-secondary-700 group-hover:bg-secondary-600 group-hover:text-white',
      border: 'hover:border-secondary-300',
      arrow: 'group-hover:text-secondary-600',
    },
    chip: 'bg-secondary-100 text-secondary-700',
  },
  {
    key: 'student',
    title: 'Student',
    subtitle: 'Check attendance, fees & homework.',
    badge: 'Roll No',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    variant: 'secondary',
    loginTitle: 'Student Portal',
    loginNote: 'Sign in with your school code and roll number.',
    panel: {
      badge: 'Roll number',
      heading: 'Your school day, at a glance.',
      description: 'View attendance, fee status, homework and results with just a roll number.',
      features: ['Attendance', 'Fee status', 'Homework', 'Results'],
    },
    card: {
      iconBox: 'bg-pink-100 text-pink-700 group-hover:bg-pink-600 group-hover:text-white',
      border: 'hover:border-pink-300',
      arrow: 'group-hover:text-pink-600',
    },
    chip: 'bg-pink-100 text-pink-700',
  },
];
