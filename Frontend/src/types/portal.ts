/** Portal types — re-export all from focused modules */
export type {
  PortalHomework, PortalCircular, PortalExamResult, PortalTimetableSlot,
  PortalConductRemark, PortalPTMSession, PortalExamPaper, PortalExamSheet,
  PortalLeaveRequest,
} from './portalViews';

export interface PortalOverview {
  attendance: {
    totalDays: number; uniqueDays: number; present: number; late: number;
    absent: number; leave: number; percentage: number;
  };
  fees: {
    totalCharged: string; totalPaid: string; outstanding: string;
    recordCount: number; unpaid: number; partial: number; paid: number;
  };
  homeworkCount: number;
  circularCount: number;
  studyMaterialCount: number;
}

export interface PortalAttendanceRecord {
  date: string; status: string; checkIn?: string; checkOut?: string;
  studentId?: string;
  student?: { id: string; firstName: string; lastName: string };
}

export interface PortalAttendanceSummary {
  totalDays: number; uniqueDays: number; present: number; late: number;
  absent: number; leave: number; halfDay: number; percentage: number;
}

export interface PortalAttendanceResponse {
  records: PortalAttendanceRecord[];
  summary: PortalAttendanceSummary;
}

export interface PortalFeeRecord {
  id: string; studentId: string; dueDate: string; totalAmount: number;
  paidAmount: number; dueCharges: number; status: string;
  student: { id: string; firstName: string; lastName: string };
  payments: { id: string; amount: number; method: string; paidAt: string }[];
}

export interface PortalFeeSummary {
  totalCharged: string; totalPaid: string; outstanding: string;
  recordCount: number; unpaid: number; partial: number; paid: number;
}

export interface PortalFeeResponse {
  records: PortalFeeRecord[];
  summary: PortalFeeSummary;
}

export interface PortalAttendanceYearSummary {
  id: string;
  yearLabel: string;
  dateFrom: string;
  dateTo: string;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  daysLeave: number;
  daysManual: number;
  totalDays: number;
}

export interface PortalFeeYearSummary {
  id: string;
  yearLabel: string;
  dateFrom: string;
  dateTo: string;
  recordCount: number;
  totalCharged: string;
  totalPaid: string;
  paidRecords: number;
  partialRecords: number;
  unpaidRecords: number;
  overdueRecords: number;
}
