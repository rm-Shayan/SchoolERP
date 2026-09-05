'use client';

import api from './client';
import { openPdf } from './pdfLinks';
import { exportAdmissionsCsv } from './admissionExport';
import type { ApiResponse, Applicant, ApplicantDocument, ApplicantDocumentType, AdmissionStatus } from '@/types';

export interface AdmissionCreatePayload {
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
  advanceFeeAmount?: number;
}

export interface PublicInquiryPayload {
  schoolId: string;
  classId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dob?: string;
  parentName: string;
  parentPhone?: string;
  parentWhatsappNo: string;
  parentEmail?: string;
  parentAddress?: string;
}

export interface AdmissionFunnelStats {
  INQUIRY: number;
  TEST_SCHEDULED: number;
  TEST_PASSED: number;
  TEST_FAILED: number;
  FORM_SUBMITTED: number;
  APPROVED: number;
  FEE_PENDING: number;
  ENROLLED: number;
  REJECTED: number;
  total: number;
}

export interface ApplicantListEnvelope {
  items: Applicant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdmissionListParams {
  schoolId?: string;
  status?: AdmissionStatus;
  classId?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const admissionService = {
  getPublicClasses: async (schoolId: string): Promise<{ id: string; name: string }[]> => {
    const res = await api.get<ApiResponse<{ id: string; name: string }[]>>('/admissions/public/classes', { params: { schoolId } });
    return res.data.data;
  },
  submitPublicInquiry: async (data: PublicInquiryPayload): Promise<{ id: string }> => {
    const res = await api.post<ApiResponse<{ id: string }>>('/admissions/public/inquiry', data);
    return res.data.data;
  },
  create: async (schoolId: string, data: AdmissionCreatePayload): Promise<Applicant> => {
    const res = await api.post<ApiResponse<Applicant>>(`/admissions/schools/${schoolId}`, data);
    return res.data.data;
  },
  getPaginated: async (params?: AdmissionListParams): Promise<ApplicantListEnvelope> => {
    const res = await api.get<ApiResponse<ApplicantListEnvelope>>('/admissions', { params });
    return res.data.data;
  },
  getFunnel: async (schoolId?: string): Promise<AdmissionFunnelStats> => {
    const res = await api.get<ApiResponse<AdmissionFunnelStats>>('/admissions/funnel', { params: { schoolId } });
    return res.data.data;
  },
  updateStatus: async (id: string, status: AdmissionStatus, data?: { testDate?: string; testTime?: string; testVenue?: string; testMarks?: string; remarks?: string }): Promise<Applicant> => {
    const res = await api.patch<ApiResponse<Applicant>>(`/admissions/${id}/status`, { status, ...data });
    return res.data.data;
  },
  update: async (id: string, data: Partial<AdmissionCreatePayload>): Promise<Applicant> => {
    const res = await api.patch<ApiResponse<Applicant>>(`/admissions/${id}`, data);
    return res.data.data;
  },
  remove: async (id: string): Promise<{ id: string }> => {
    const res = await api.delete<ApiResponse<{ id: string }>>(`/admissions/${id}`);
    return res.data.data;
  },
  uploadPhoto: async (id: string, file: File): Promise<Applicant> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<Applicant>>(`/admissions/${id}/photo`, formData);
    return res.data.data;
  },
  importExcel: async (schoolId: string, file: File): Promise<{ jobId: string; totalRows: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<{ jobId: string; totalRows: number }>>(`/admissions/schools/${schoolId}/import`, formData);
    return res.data.data;
  },
  uploadDocument: async (id: string, file: File, type: ApplicantDocumentType): Promise<ApplicantDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await api.post<ApiResponse<ApplicantDocument>>(`/admissions/${id}/documents`, formData);
    return res.data.data;
  },
  deleteDocument: async (id: string, docId: string): Promise<{ id: string }> => {
    const res = await api.delete<ApiResponse<{ id: string }>>(`/admissions/${id}/documents/${docId}`);
    return res.data.data;
  },
  exportCsv: (params: Omit<AdmissionListParams, 'page' | 'pageSize'>) => exportAdmissionsCsv(params),
  approve: async (id: string): Promise<Applicant> => {
    const res = await api.post<ApiResponse<Applicant>>(`/admissions/${id}/approve`, {});
    return res.data.data;
  },
  recordAdvanceFee: async (id: string, amount: number): Promise<Applicant> => {
    const res = await api.post<ApiResponse<Applicant>>(`/admissions/${id}/advance-fee`, { amount });
    return res.data.data;
  },
  enroll: async (id: string, data: { sectionId: string; rollNumber?: string; advanceFeePaid?: boolean }): Promise<{ applicant: Applicant; student: { id: string }; identifierCode: string }> => {
    const res = await api.post<ApiResponse<{ applicant: Applicant; student: { id: string }; identifierCode: string }>>(`/admissions/${id}/enroll`, data);
    return res.data.data;
  },
  getById: async (id: string): Promise<Applicant> => {
    const res = await api.get<ApiResponse<Applicant>>(`/admissions/${id}`);
    return res.data.data;
  },
  // GET /admissions/:id/slip — PDF blob, token-safe (raw window.open 401 deta tha)
  getSlipPdf: async (id: string): Promise<void> => {
    await openPdf(`/admissions/${id}/slip`);
  },
  // POST /admissions/:id/send-slip — regenerate slip PDF + send to parent
  sendSlipToParent: async (id: string): Promise<{ delivered: boolean; channel?: string; reason?: string }> => {
    const res = await api.post<ApiResponse<{ delivered: boolean; channel?: string; reason?: string }>>(`/admissions/${id}/send-slip`, {});
    return res.data.data;
  },
};
