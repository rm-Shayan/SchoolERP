export interface ImportColumn {
  col: string;
  req: boolean;
  example: string;
}

export const STUDENT_COLUMNS: ImportColumn[] = [
  { col: 'First Name', req: true, example: 'Ahmed' },
  { col: 'Last Name', req: true, example: 'Khan' },
  { col: 'Class Name', req: true, example: 'Class 5' },
  { col: 'Section Name', req: true, example: 'A' },
  { col: 'Roll Number', req: true, example: '101' },
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
  { col: 'Role', req: true, example: 'TEACHER / STAFF / ACCOUNTANT' },
  { col: 'Password', req: false, example: 'Welcome@123 (auto if blank)' },
];

export const STAFF_ATTENDANCE_COLUMNS: ImportColumn[] = [
  { col: 'Staff Name', req: true, example: 'Mr. Ahmed Khan' },
  { col: 'Email', req: false, example: 'ahmed@school.edu' },
  { col: 'Date', req: true, example: '2026-08-27' },
  { col: 'Status', req: true, example: 'PRESENT / ABSENT / LATE / LEAVE' },
  { col: 'Remarks', req: false, example: 'Late by 10 mins' },
];
