import type { Student, StudentStatus } from '@/types';

export interface StudentCreatePayload {
  sectionId: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  gender?: string;
  dob?: string;
  parentName?: string;
  parentWhatsappNo?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentAddress?: string;
}

export interface StudentUpdatePayload {
  firstName?: string;
  lastName?: string;
  rollNumber?: string;
  gender?: string | null;
  dob?: string | null;
  sectionId?: string;
  parentName?: string;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentAddress?: string | null;
}

export interface StudentSummary {
  total: number;
  ACTIVE: number;
  GRADUATED: number;
  DROPPED_OUT: number;
  TRANSFERRED_OUT: number;
  blocked: number;
}

export interface StudentListParams {
  schoolId?: string;
  sectionId?: string;
  classId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface StudentListEnvelope {
  items: Student[];
  total: number;
  page: number;
  pageSize: number;
  summary?: StudentSummary;
}

export interface PlatformStudentListParams {
  organizationId?: string;
  schoolId?: string;
  classId?: string;
  sectionId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
