import type { Organization, School } from './org';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'RECEPTIONIST';
export type UserType = 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT';
export type StudentStatus = 'ACTIVE' | 'GRADUATED' | 'DROPPED_OUT' | 'TRANSFERRED_OUT';
export type FeeStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type AdmissionStatus =
  | 'INQUIRY'
  | 'TEST_SCHEDULED'
  | 'TEST_PASSED'
  | 'TEST_FAILED'
  | 'FORM_SUBMITTED'
  | 'APPROVED'
  | 'FEE_PENDING'
  | 'ENROLLED'
  | 'REJECTED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'MANUAL_OVERRIDE';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER';
export type RemarkType = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
export type DeliveryStatus = 'NOT_DELIVERED' | 'DELIVERING' | 'DELIVERED' | 'FAILED';

export type OrgStatus = 'SETUP_PENDING' | 'ACTIVE' | 'PARTIALLY_BLOCKED' | 'BLOCKED';
export type SchoolStatus = 'ACTIVE' | 'BLOCKED';

export interface BlockInfo {
  blockedAt?: string;
  blockedReason?: string;
  blockedById?: string;
  blockedByName?: string;
}

export interface User {
  id: string;
  organizationId?: string;
  schoolId?: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
  role: Role;
  isActive: boolean;
  blockedAt?: string;
  blockedReason?: string;
  blockedById?: string;
  blockedByName?: string;
  createdAt: string;
  organization?: Organization;
  school?: School;
  /** Extra branches this same account can open (home branch = schoolId). */
  branchAccess?: string[];
  /** Accessible branches — home + extras (multi-branch admin). */
  schools?: School[];
}

export interface LoginRequest {
  email?: string;
  username?: string;
  schoolCode?: string;
  password: string;
}

export interface SchoolBranding {
  code: string;
  name: string;
  slug?: string | null;
  orgName?: string | null;
  logoUrl?: string | null;
  themeColor: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  organization?: Organization;
  school?: School;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
