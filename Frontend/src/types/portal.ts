/** Portal-specific types for the student/parent portal views */

export interface PortalOverview {
  attendance: {
    totalDays: number;
    uniqueDays: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    percentage: number;
  };
  fees: {
    totalCharged: string;
    totalPaid: string;
    outstanding: string;
    recordCount: number;
    unpaid: number;
    partial: number;
    paid: number;
  };
  homeworkCount: number;
  circularCount: number;
}

export interface PortalAttendanceRecord {
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  student?: { id: string; firstName: string; lastName: string };
}

export interface PortalAttendanceSummary {
  totalDays: number;
  uniqueDays: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  percentage: number;
}

export interface PortalAttendanceResponse {
  records: PortalAttendanceRecord[];
  summary: PortalAttendanceSummary;
}

export interface PortalFeeRecord {
  id: string;
  studentId: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  dueCharges: number;
  status: string;
  student: { id: string; firstName: string; lastName: string };
  payments: { id: string; amount: number; method: string; paidAt: string }[];
}

export interface PortalFeeSummary {
  totalCharged: string;
  totalPaid: string;
  outstanding: string;
  recordCount: number;
  unpaid: number;
  partial: number;
  paid: number;
}

export interface PortalFeeResponse {
  records: PortalFeeRecord[];
  summary: PortalFeeSummary;
}

export interface PortalHomework {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  sentAt: string;
  section: { id: string; name: string; class: { name: string } };
  createdBy?: { id: string; name: string };
}

export interface PortalCircular {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  audience: string;
  createdAt: string;
}

export interface PortalExamResult {
  id: string;
  marksObtained: number;
  maxMarks: number;
  remarks?: string;
  exam: { id: string; name: string; startDate: string; term?: { name: string } };
  subject: { id: string; name: string };
}

export interface PortalTimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: { id: string; name: string };
  teacher: { id: string; name: string };
}

export interface PortalConductRemark {
  id: string;
  type: string;
  comment: string;
  createdAt: string;
  teacher: { id: string; name: string };
}

export interface PortalPTMSession {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  location?: string;
  status: string;
}

export interface PortalExamPaper {
  id: string;
  classId: string;
  subjectId: string;
  sectionId?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  maxMarks?: number | null;
  roomNumber?: string | null;
  subject: { id: string; name: string };
  section?: { id: string; name: string } | null;
  class: { id: string; name: string };
}

export interface PortalExamSheet {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  term?: { id: string; name: string; academicYear?: { id: string; name: string } };
  papers: PortalExamPaper[];
  _count?: { results: number };
}

export interface PortalLeaveRequest {
  id: string;
  studentId: string;
  dateFrom: string;
  dateTo: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string; rollNumber: string };
}
