import api from './client';
import { openPdf, fetchPdfUrl } from './pdfLinks';
import { downloadBlob } from '@/lib/utils';
import type {
  ApiResponse, FeeRecord, FeeStructure, FeeYearSummary, FeeStructurePayload,
  FeePaymentPayload, FeeRecordListParams, FeeRecordListEnvelope,
  GenerateMonthlyPayload, GenerateMonthlyResult, SchoolDueDay, FeeSummary,
} from '@/types';

export const feeService = {
  createStructure: async (schoolId: string, data: FeeStructurePayload): Promise<FeeStructure> => {
    const res = await api.post<ApiResponse<FeeStructure>>(`/fees/schools/${schoolId}/structures`, data);
    return res.data.data;
  },
  getStructuresBySchool: async (schoolId: string): Promise<FeeStructure[]> => {
    const res = await api.get<ApiResponse<FeeStructure[]>>(`/fees/schools/${schoolId}/structures`);
    return res.data.data;
  },
  getAllStructures: async (): Promise<FeeStructure[]> => {
    const res = await api.get<ApiResponse<FeeStructure[]>>('/fees/structures');
    return res.data.data;
  },
  getStructure: async (id: string): Promise<FeeStructure> => {
    const res = await api.get<ApiResponse<FeeStructure>>(`/fees/structures/${id}`);
    return res.data.data;
  },
  updateStructure: async (id: string, data: Partial<FeeStructurePayload>): Promise<FeeStructure> => {
    const res = await api.put<ApiResponse<FeeStructure>>(`/fees/structures/${id}`, data);
    return res.data.data;
  },
  deleteStructure: async (id: string): Promise<void> => { await api.delete(`/fees/structures/${id}`); },
  generateMonthly: async (data: GenerateMonthlyPayload): Promise<GenerateMonthlyResult> => {
    const res = await api.post<ApiResponse<GenerateMonthlyResult>>('/fees/generate-monthly', data);
    return res.data.data;
  },
  getSummary: async (params: { schoolId: string; month?: number; year?: number }): Promise<FeeSummary> => {
    const res = await api.get<ApiResponse<FeeSummary>>('/fees/records/summary', { params });
    return res.data.data;
  },
  exportCsv: async (params: { schoolId: string; month?: number; year?: number; status?: string }): Promise<void> => {
    const res = await api.get<string>('/fees/records/export', { params, responseType: 'text' });
    downloadBlob(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }), `fee-records-${new Date().toISOString().slice(0, 10)}.csv`);
  },
  getSchoolDueDay: async (schoolId: string): Promise<{ schoolId: string; monthlyFeeDueDay: number }> => {
    const res = await api.get<ApiResponse<{ schoolId: string; monthlyFeeDueDay: number }>>(`/fees/schools/${schoolId}/due-day`);
    return res.data.data;
  },
  setSchoolDueDay: async (schoolId: string, dueDay: number): Promise<SchoolDueDay> => {
    const res = await api.put<ApiResponse<SchoolDueDay>>(`/fees/schools/${schoolId}/due-day`, { dueDay });
    return res.data.data;
  },
  updateRecordDueDate: async (feeRecordId: string, dueDate: string): Promise<FeeRecord> => {
    const res = await api.patch<ApiResponse<FeeRecord>>(`/fees/records/${feeRecordId}/due-date`, { dueDate });
    return res.data.data;
  },
  getRecords: async (params?: FeeRecordListParams): Promise<FeeRecord[]> => {
    const res = await api.get<ApiResponse<FeeRecordListEnvelope>>('/fees/records', { params });
    return res.data.data.items;
  },
  getBulkRecords: async (params: { schoolId: string; studentIds?: string[]; status?: string }): Promise<Record<string, FeeRecord[]>> => {
    const res = await api.get<ApiResponse<Record<string, FeeRecord[]>>>('/fees/records/bulk', { params });
    return res.data.data;
  },
  getPage: async (params?: FeeRecordListParams): Promise<FeeRecordListEnvelope> => {
    const res = await api.get<ApiResponse<FeeRecordListEnvelope>>('/fees/records', { params });
    return res.data.data;
  },
  getRecord: async (id: string): Promise<FeeRecord> => {
    const res = await api.get<ApiResponse<FeeRecord>>(`/fees/records/${id}`);
    return res.data.data;
  },
  getYearlySummaries: async (studentId: string): Promise<FeeYearSummary[]> => {
    const res = await api.get<ApiResponse<FeeYearSummary[]>>(`/fees/students/${studentId}/yearly-summaries`);
    return res.data.data;
  },
  recordPayment: async (feeRecordId: string, data: FeePaymentPayload): Promise<FeeRecord> => {
    const res = await api.post<ApiResponse<FeeRecord>>(`/fees/records/${feeRecordId}/payments`, data);
    return res.data.data;
  },
  scanCollect: async (feeRecordId: string): Promise<FeeRecord> => {
    const res = await api.post<ApiResponse<FeeRecord>>(`/fees/records/${feeRecordId}/scan`);
    return res.data.data;
  },
  sendReminders: async (data: { schoolId: string; month?: number; year?: number }): Promise<{ remindersSent: number }> => {
    const res = await api.post<ApiResponse<{ remindersSent: number }>>('/fees/reminders', data);
    return res.data.data;
  },
  sendRecordReminder: async (feeRecordId: string): Promise<{ sent: boolean; recordId: string }> => {
    const res = await api.post<ApiResponse<{ sent: boolean; recordId: string }>>(`/fees/records/${feeRecordId}/remind`);
    return res.data.data;
  },
  calculateDueCharges: async (schoolId?: string): Promise<{ updated: number }> => {
    const res = await api.post<ApiResponse<{ updated: number }>>('/fees/calculate-due-charges', { schoolId });
    return res.data.data;
  },
  // Voucher PDFs
  getReceiptPdf: async (id: string) => { await openPdf(`/documents/fee-voucher/${id}`); },
  getVoucherPdf: async (id: string, ids?: string[]) => { await openPdf(`/documents/fee-voucher/${id}${ids?.length ? `?merge=1&recordIds=${ids.join(',')}` : '?merge=1'}`); },
  getVoucherViewUrl: async (id: string, ids?: string[]): Promise<string> => fetchPdfUrl(`/documents/fee-voucher/${id}${ids?.length ? `?merge=1&recordIds=${ids.join(',')}` : '?merge=1'}`),
  getVoucherA5Pdf: async (id: string, ids?: string[]) => { await openPdf(`/documents/fee-voucher/${id}${ids?.length ? `?size=a5&merge=1&recordIds=${ids.join(',')}` : '?size=a5&merge=1'}`); },
  getBulkVouchersPdf: async (params: { classId?: string; month?: number; year?: number; status?: string; studentIds?: string[] }) => {
    const qs = new URLSearchParams(); if (params.classId) qs.set('classId', params.classId); if (params.month) qs.set('month', String(params.month)); if (params.year) qs.set('year', String(params.year)); if (params.status) qs.set('status', params.status); if (params.studentIds?.length) qs.set('studentIds', params.studentIds.join(','));
    await openPdf(`/fees/records/bulk-vouchers?${qs.toString()}`);
  },
  getBulkVouchersViewUrl: async (params: { classId?: string; month?: number; year?: number }): Promise<string> => {
    const qs = new URLSearchParams(); if (params.classId) qs.set('classId', params.classId); if (params.month) qs.set('month', String(params.month)); if (params.year) qs.set('year', String(params.year));
    return fetchPdfUrl(`/fees/records/bulk-vouchers?${qs.toString()}`);
  },
};
