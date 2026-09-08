import type { AdmissionStatus, FeeStatus, StudentStatus } from './core';
import type { Class, Section } from './academic';
import type { School } from './org';

export interface Parent {
  id: string;
  name: string;
  whatsappNo: string;
  phone?: string;
  email?: string;
  address?: string;
  isBlocked?: boolean;
  blockedReason?: string;
  remarks?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  sectionId: string;
  parentId: string;
  identifierCode: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dob?: string;
  status: StudentStatus;
  isBlocked?: boolean;
  blockedReason?: string;
  blockedByName?: string;
  blockedAt?: string;
  imageUrl?: string;
  remarks?: string;
  createdAt: string;
  section?: Section;
  parent?: Parent;
  school?: School;
}

export type ApplicantDocumentType = 'B_FORM' | 'BIRTH_CERTIFICATE' | 'OTHER';
export interface ApplicantDocument {
  id: string;
  applicantId: string;
  type: ApplicantDocumentType;
  filename: string;
  url: string;
  createdAt: string;
}

export interface Applicant {
  id: string;
  schoolId: string;
  classId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dob?: string;
  parentName: string;
  parentPhone: string;
  parentWhatsappNo: string;
  parentEmail?: string;
  parentAddress?: string;
  imageUrl?: string;
  testDate?: string;
  testTime?: string;
  testVenue?: string;
  testMarks?: string;
  status: AdmissionStatus;
  advanceFeeAmount?: number;
  advanceFeeStatus: FeeStatus;
  createdAt: string;
  class?: Class;
  documents?: ApplicantDocument[];
}
