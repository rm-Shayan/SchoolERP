import type { FeeStatus, PaymentMethod } from './core';
import type { Student } from './people';

export interface FeePeriod {
  year: number;
  month: number;
  label: string;
  amount: number;
  status?: string; // UNPAID | PAID
}

export interface FeeRecord {
  id: string;
  studentId: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  dueCharges: number; // late fee charges — auto-calculated from fee structure line items
  status: FeeStatus;
  periods?: FeePeriod[]; // month-wise itemization — har mahina apni row
  reminderSentAt?: string; // overdue message ek dafa bhejne ka marker
  student?: Student;
  payments?: FeePayment[];
}

export interface FeePayment {
  id: string;
  feeRecordId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  reference?: string;
}

export interface FeeStructure {
  id: string;
  schoolId: string;
  // m2m migration ke baad FeeStructure `classes[]` relation use karta hai
  // (ek structure kai classes par apply). classId sirf create/edit form
  // payload ke liye legacy hai — response mein classes[] aata hai.
  classId?: string;
  classes?: { id: string; name: string }[];
  academicYearId: string;
  name: string;
  lineItems?: FeeLineItem[];
}

export interface FeeLineItem {
  id: string;
  feeStructureId: string;
  title: string;
  amount: number;
  isLateFee?: boolean; // agar true hai to due date cross hone par auto-add hota hai
  lateFeeDays?: number; // grace period: kitne din baad late fee lage
}

export interface FeeStructurePayload {
  classId: string;
  academicYearId: string;
  name: string;
  lineItems: { title: string; amount: number; isLateFee?: boolean; lateFeeDays?: number }[];
}

export interface FeePaymentPayload {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt?: string;
  allocateOpenRecords?: boolean;
  periodMonths?: { year: number; month: number }[];
  recordIds?: string[]; // specific monthly records (months) pay karne ke liye
  allocations?: { recordId: string; amount: number }[];
}

/** GET /fees/records — server-side pagination params (envelope response). */
export interface FeeRecordListParams {
  schoolId?: string;
  studentId?: string;
  classId?: string;
  status?: string;
  dueDateBefore?: string;
  dueDateAfter?: string;
  page?: number;
  pageSize?: number;
}

export interface FeeRecordListEnvelope {
  items: FeeRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GenerateMonthlyPayload {
  schoolId: string;
  month: number;
  year: number;
  structureId?: string;
  dueDay?: number;
}

export interface GenerateMonthlyResult {
  monthLabel: string;
  dueDate: string;
  dueDay: number;
  created: number;
  studentsInScope: number;
}

export interface SchoolDueDay {
  id: string;
  name: string;
  monthlyFeeDueDay: number;
}

export interface FeeSummary {
  total: number;
  collected: number;
  outstanding: number;
  totalCharges: number; // total late fee charges collected
  counts: { UNPAID: number; PARTIAL: number; PAID: number; OVERDUE: number };
}

/** Per-student yearly fee rollup — GET /fees/students/:id/yearly-summaries */
export interface FeeYearSummary {
  yearLabel: string;
  recordCount: number;
  totalCharged: number;
  totalPaid: number;
  outstanding: number;
  paidRecords: number;
  partialRecords: number;
  unpaidRecords: number;
}
