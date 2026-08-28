import type { AttendanceStatus } from './core';
import type { Student } from './people';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
  student?: Student;
}

export interface DailyAttendanceSummary {
  date: string;
  totalMarked: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  manualOverride: number;
}

/** GET /attendance/daily returns { summary, records } — array nahi! */
export interface DailyAttendanceReport {
  summary: DailyAttendanceSummary;
  records: AttendanceRecord[];
}

/** Archived yearly attendance rollup — AttendanceYearSummary (365 din purani
 *  raw attendance yahan move hoti hai, raw records delete ho jate hain). */
export interface AttendanceYearSummary {
  id: string;
  studentId: string;
  schoolId: string;
  yearLabel: string;
  dateFrom: string;
  dateTo: string;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  daysLeave: number;
  daysManual: number;
  totalDays: number;
  createdAt: string;
}

/** Per-section attendance summary within the monthly report */
export interface SectionAttendanceSummary {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  summary: {
    totalStudents: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    manualOverride: number;
    totalRecords: number;
  };
  records: AttendanceRecord[];
}

/** Class grouping inside the monthly report */
export interface ClassAttendanceGroup {
  classId: string;
  className: string;
  sections: SectionAttendanceSummary[];
}

/** Full monthly attendance report response */
export interface MonthlyAttendanceReport {
  year: number;
  month: number;
  summary: {
    totalMarked: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    manualOverride: number;
    totalWorkingDays: number;
  };
  classes: ClassAttendanceGroup[];
}
