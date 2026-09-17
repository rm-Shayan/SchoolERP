export interface ImportColumn {
  col: string;
  req: boolean;
  example: string;
}

export const STUDENT_COLUMNS: ImportColumn[] = [
  { col: 'First Name', req: true, example: 'Ahmed' },
  { col: 'Last Name', req: false, example: 'Khan' },
  { col: 'Class Name', req: true, example: 'Class 5' },
  { col: 'Section Name', req: true, example: 'A' },
  { col: 'Roll Number', req: true, example: '101' },
  { col: 'Parent WhatsApp', req: true, example: '03001234567' },
  { col: 'Gender', req: false, example: 'Male / Female' },
  { col: 'DOB', req: false, example: '2012-05-15' },
  { col: 'Parent Name', req: false, example: 'Mr. Khan' },
  { col: 'Parent Phone', req: false, example: '03001234567' },
  { col: 'Parent Email', req: false, example: 'khan@email.com' },
  { col: 'Parent Address', req: false, example: '123 Main St' },
];

export const TIMETABLE_COLUMNS: ImportColumn[] = [
  { col: 'Day', req: true, example: 'Monday / 1' },
  { col: 'Subject', req: true, example: 'Mathematics' },
  { col: 'Teacher', req: true, example: 'Mr. Ahmed Khan' },
  { col: 'Start Time', req: true, example: '08:00' },
  { col: 'End Time', req: true, example: '08:45' },
];

export const TIMETABLE_MULTI_COLUMNS: ImportColumn[] = [
  ...TIMETABLE_COLUMNS,
  { col: 'Section', req: false, example: 'A / Class 5 - A' },
];

export const STAFF_COLUMNS: ImportColumn[] = [
  { col: 'Name', req: true, example: 'Mr. Ahmed Khan' },
  { col: 'Email', req: true, example: 'ahmed@school.edu' },
  { col: 'Phone', req: false, example: '03001234567' },
  { col: 'Role', req: true, example: 'ADMIN / TEACHER / RECEPTIONIST' },
];

export const ADMISSION_COLUMNS: ImportColumn[] = [
  { col: 'First Name', req: true, example: 'Ahmed' },
  { col: 'Last Name', req: false, example: 'Khan' },
  { col: 'Class Name', req: true, example: 'Class 5' },
  { col: 'Parent Name', req: true, example: 'Mr. Khan' },
  { col: 'Parent Phone', req: false, example: '03001234567' },
  { col: 'Parent WhatsApp', req: false, example: '03001234567' },
  { col: 'Parent Email', req: false, example: 'khan@email.com' },
  { col: 'DOB', req: false, example: '2012-05-15' },
  { col: 'Gender', req: false, example: 'Male / Female' },
  { col: 'Advance Fee', req: false, example: '5000' },
];

export const STAFF_ATTENDANCE_COLUMNS: ImportColumn[] = [
  { col: 'Staff Name', req: true, example: 'Mr. Ahmed Khan' },
  { col: 'Email', req: false, example: 'ahmed@school.edu' },
  { col: 'Date', req: true, example: '2026-08-27' },
  { col: 'Status', req: true, example: 'PRESENT / ABSENT / LATE / LEAVE / HALF_DAY' },
  { col: 'Remarks', req: false, example: 'Late by 10 mins' },
];

export type ImportType = 'students' | 'staff' | 'staff-attendance' | 'timetable' | 'admissions';

export const TAB_META: Record<ImportType, { label: string; icon: string }> = {
  students: {
    label: 'Students',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  },
  staff: {
    label: 'Staff',
    icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z',
  },
  'staff-attendance': {
    label: 'Staff Attendance',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  timetable: {
    label: 'Timetable',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  admissions: {
    label: 'Admissions',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
};

export const TIPS: Record<ImportType, string[]> = {
  students: [
    'Class Name / Section Name must exactly match existing classes in the Academic Setup.',
    'Roll Number must be unique within the school.',
    'Parent WhatsApp is required — it unlocks the parent portal account.',
  ],
  staff: [
    'Role only accepts these values: ADMIN, TEACHER, RECEPTIONIST.',
    'Credentials are auto-generated and emailed — no password column needed.',
    'Email must be unique — each staff member gets a unique account.',
  ],
  'staff-attendance': [
    'Matches by Staff Name or Email — exact name or email is required.',
    'Date format must be YYYY-MM-DD (e.g. 2026-08-27).',
    'Status accepts: PRESENT, ABSENT, LATE, LEAVE, HALF_DAY.',
    'If a record for the same staff + date already exists, it will be overwritten.',
  ],
  timetable: [
    'Each row is for one section — use the "Class 5 - A" format in the Section column.',
    'The Day column accepts both day names (Monday) and numbers (1-7).',
    'The Teacher column requires the exact name as it appears in the staff list.',
  ],
  admissions: [
    'Class Name must exactly match an existing class in the Academic Setup.',
    'Imported applicants are created as INQUIRY status and appear on the Admissions page.',
    'If Parent WhatsApp is blank, Parent Phone is used for the parent account.',
  ],
};

export const COLUMNS_BY_TYPE: Record<ImportType, ImportColumn[]> = {
  students: STUDENT_COLUMNS,
  staff: STAFF_COLUMNS,
  'staff-attendance': STAFF_ATTENDANCE_COLUMNS,
  timetable: TIMETABLE_MULTI_COLUMNS,
  admissions: ADMISSION_COLUMNS,
};
