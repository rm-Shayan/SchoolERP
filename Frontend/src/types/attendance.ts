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

/** School off day / holiday — extra closure beyond weekends */
export interface OffDay {
  date: string; // "YYYY-MM-DD"
  reason?: string | null;
}

/** GET /attendance/daily returns { summary, records } — array nahi! */
export interface DailyAttendanceReport {
  summary: DailyAttendanceSummary;
  records: AttendanceRecord[];
  offDays?: OffDay[];
  /** which weekdays are off — [0..6] (0=Sun .. 6=Sat). Default [0,6]. */
  weeklyOff?: number[];
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

/** Minimal student row for the monthly attendance matrix (all enrolled,
 *  not just the ones with records that month). */
export interface StudentLite {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  imageUrl?: string | null;
  sectionId?: string;
}

/** Per-section attendance summary within the monthly report */
export interface SectionAttendanceSummary {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  students: StudentLite[];
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
  offDays?: OffDay[];
  /** which weekdays are off — [0..6] (0=Sun .. 6=Sat). Default [0,6]. */
  weeklyOff?: number[];
  classes: ClassAttendanceGroup[];
}
