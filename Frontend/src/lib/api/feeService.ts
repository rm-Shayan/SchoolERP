import api from './client';
import { openPdf, fetchPdfUrl } from './pdfLinks';
import { downloadBlob } from '@/lib/utils';
import type {
  ApiResponse,
  FeeRecord,
  FeeStructure,
  FeeYearSummary,
  FeeStructurePayload,
  FeePaymentPayload,
  FeeRecordListParams,
  FeeRecordListEnvelope,
  GenerateMonthlyPayload,
  GenerateMonthlyResult,
  SchoolDueDay,
  FeeSummary,
} from '@/types';

export const feeService = {
  // POST /fees/schools/:schoolId/structures — FINANCE
  createStructure: async (schoolId: string, data: FeeStructurePayload): Promise<FeeStructure> => {
    const res = await api.post<ApiResponse<FeeStructure>>(`/fees/schools/${schoolId}/structures`, data);
    return res.data.data;
  },

  // GET /fees/schools/:schoolId/structures — FINANCE
  getStructuresBySchool: async (schoolId: string): Promise<FeeStructure[]> => {
    const res = await api.get<ApiResponse<FeeStructure[]>>(`/fees/schools/${schoolId}/structures`);
    return res.data.data;
  },

  // GET /fees/structures — FINANCE
  getAllStructures: async (): Promise<FeeStructure[]> => {
    const res = await api.get<ApiResponse<FeeStructure[]>>('/fees/structures');
    return res.data.data;
  },

  // GET /fees/structures/:id — FINANCE
  getStructure: async (id: string): Promise<FeeStructure> => {
    const res = await api.get<ApiResponse<FeeStructure>>(`/fees/structures/${id}`);
    return res.data.data;
  },

  // PUT /fees/structures/:id — FINANCE
  updateStructure: async (id: string, data: Partial<FeeStructurePayload>): Promise<FeeStructure> => {
    const res = await api.put<ApiResponse<FeeStructure>>(`/fees/structures/${id}`, data);
    return res.data.data;
  },

  // DELETE /fees/structures/:id — FINANCE
  deleteStructure: async (id: string): Promise<void> => {
    await api.delete(`/fees/structures/${id}`);
  },

  // POST /fees/generate-monthly — FINANCE (dueDay optional: saved default use hota hai)
  generateMonthly: async (data: GenerateMonthlyPayload): Promise<GenerateMonthlyResult> => {
    const res = await api.post<ApiResponse<GenerateMonthlyResult>>('/fees/generate-monthly', data);
    return res.data.data;
  },

  // GET /fees/records/summary — FINANCE (month ka total/collected/outstanding + counts)
  getSummary: async (params: { schoolId: string; month?: number; year?: number }): Promise<FeeSummary> => {
    const res = await api.get<ApiResponse<FeeSummary>>('/fees/records/summary', { params });
    return res.data.data;
  },

  // GET /fees/records/export — FINANCE (month ka poora fee record CSV download)
  exportCsv: async (params: { schoolId: string; month?: number; year?: number; status?: string }): Promise<void> => {
    const res = await api.get<string>('/fees/records/export', { params, responseType: 'text' });
    downloadBlob(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }), `fee-records-${new Date().toISOString().slice(0, 10)}.csv`);
  },

  // GET /fees/schools/:schoolId/due-day — FINANCE (current default due day)
  getSchoolDueDay: async (schoolId: string): Promise<{ schoolId: string; monthlyFeeDueDay: number }> => {
    const res = await api.get<ApiResponse<{ schoolId: string; monthlyFeeDueDay: number }>>(`/fees/schools/${schoolId}/due-day`);
    return res.data.data;
  },

  // PUT /fees/schools/:schoolId/due-day — FINANCE (school ka default monthly due day)
  setSchoolDueDay: async (schoolId: string, dueDay: number): Promise<SchoolDueDay> => {
    const res = await api.put<ApiResponse<SchoolDueDay>>(`/fees/schools/${schoolId}/due-day`, { dueDay });
    return res.data.data;
  },

  // PATCH /fees/records/:id/due-date — FINANCE (ek student ka is month ka due date extend)
  updateRecordDueDate: async (feeRecordId: string, dueDate: string): Promise<FeeRecord> => {
    const res = await api.patch<ApiResponse<FeeRecord>>(`/fees/records/${feeRecordId}/due-date`, { dueDate });
    return res.data.data;
  },

  // GET /fees/records — FINANCE (backend paginated envelope — unwrap items)
  getRecords: async (params?: FeeRecordListParams): Promise<FeeRecord[]> => {
    const res = await api.get<ApiResponse<FeeRecordListEnvelope>>('/fees/records', { params });
    return res.data.data.items;
  },

  // GET /fees/records/bulk — FINANCE (N+1 eliminate: saare students ke records ek query)
  // studentIds optional: agar empty → school ke saare students
  getBulkRecords: async (params: { schoolId: string; studentIds?: string[]; status?: string }): Promise<Record<string, FeeRecord[]>> => {
    const res = await api.get<ApiResponse<Record<string, FeeRecord[]>>>('/fees/records/bulk', { params });
    return res.data.data;
  },

  // GET /fees/records — FINANCE server-side pagination (page/pageSize/total)
  getPage: async (params?: FeeRecordListParams): Promise<FeeRecordListEnvelope> => {
    const res = await api.get<ApiResponse<FeeRecordListEnvelope>>('/fees/records', { params });
    return res.data.data;
  },

  // GET /fees/records/:id — FINANCE
  getRecord: async (id: string): Promise<FeeRecord> => {
    const res = await api.get<ApiResponse<FeeRecord>>(`/fees/records/${id}`);
    return res.data.data;
  },

  // GET /fees/students/:studentId/yearly-summaries — FINANCE
  getYearlySummaries: async (studentId: string): Promise<FeeYearSummary[]> => {
    const res = await api.get<ApiResponse<FeeYearSummary[]>>(`/fees/students/${studentId}/yearly-summaries`);
    return res.data.data;
  },

  // POST /fees/records/:id/payments — FINANCE
  recordPayment: async (feeRecordId: string, data: FeePaymentPayload): Promise<FeeRecord> => {
    const res = await api.post<ApiResponse<FeeRecord>>(`/fees/records/${feeRecordId}/payments`, data);
    return res.data.data;
  },

  // GET /fees/records/:id/receipt — FINANCE (PDF blob — token-safe, new tab)
  getReceiptPdf: async (feeRecordId: string): Promise<void> => {
    await openPdf(`/documents/fee-voucher/${feeRecordId}`);
  },

  // GET /documents/fee-voucher/:id — FINANCE (voucher PDF with QR)
  getVoucherPdf: async (feeRecordId: string, recordIds?: string[]): Promise<void> => {
    const q = recordIds && recordIds.length ? `?merge=1&recordIds=${recordIds.join(',')}` : '?merge=1';
    await openPdf(`/documents/fee-voucher/${feeRecordId}${q}`);
  },

  // GET /documents/fee-voucher/:id — inline view (returns blob URL, no download)
  getVoucherViewUrl: async (feeRecordId: string, recordIds?: string[]): Promise<string> => {
    const q = recordIds && recordIds.length ? `?merge=1&recordIds=${recordIds.join(',')}` : '?merge=1';
    return fetchPdfUrl(`/documents/fee-voucher/${feeRecordId}${q}`);
  },

  // GET /documents/fee-voucher/:id?size=a5 — FINANCE (print-optimized A5 voucher)
  getVoucherA5Pdf: async (feeRecordId: string, recordIds?: string[]): Promise<void> => {
    const q = recordIds && recordIds.length ? `?size=a5&merge=1&recordIds=${recordIds.join(',')}` : '?size=a5&merge=1';
    await openPdf(`/documents/fee-voucher/${feeRecordId}${q}`);
  },

  // POST /fees/records/:id/scan — FINANCE (voucher QR scan → fee PAID)
  scanCollect: async (feeRecordId: string): Promise<FeeRecord> => {
    const res = await api.post<ApiResponse<FeeRecord>>(`/fees/records/${feeRecordId}/scan`);
    return res.data.data;
  },

  // POST /fees/reminders — FINANCE (branch-scoped: schoolId + month/year)
  sendReminders: async (data: { schoolId: string; month?: number; year?: number }): Promise<{ remindersSent: number }> => {
    const res = await api.post<ApiResponse<{ remindersSent: number }>>('/fees/reminders', data);
    return res.data.data;
  },

  // POST /fees/records/:id/remind — FINANCE (manual per-record reminder)
  sendRecordReminder: async (feeRecordId: string): Promise<{ sent: boolean; recordId: string }> => {
    const res = await api.post<ApiResponse<{ sent: boolean; recordId: string }>>(`/fees/records/${feeRecordId}/remind`);
    return res.data.data;
  },

  // POST /fees/calculate-due-charges — FINANCE (auto-calculate late fee charges)
  calculateDueCharges: async (schoolId?: string): Promise<{ updated: number }> => {
    const res = await api.post<ApiResponse<{ updated: number }>>('/fees/calculate-due-charges', { schoolId });
    return res.data.data;
  },

  // GET /fees/records/bulk-vouchers — class ke selected students ka ek PDF
  getBulkVouchersPdf: async (params: { classId?: string; month?: number; year?: number; status?: string; studentIds?: string[] }): Promise<void> => {
    const qs = new URLSearchParams();
    if (params.classId) qs.set('classId', params.classId);
    if (params.month) qs.set('month', String(params.month));
    if (params.year) qs.set('year', String(params.year));
    if (params.status) qs.set('status', params.status);
    if (params.studentIds?.length) qs.set('studentIds', params.studentIds.join(','));
    await openPdf(`/fees/records/bulk-vouchers?${qs.toString()}`);
  },
  getBulkVouchersViewUrl: async (params: { classId?: string; month?: number; year?: number }): Promise<string> => {
    const qs = new URLSearchParams();
    if (params.classId) qs.set('classId', params.classId);
    if (params.month) qs.set('month', String(params.month));
    if (params.year) qs.set('year', String(params.year));
    return fetchPdfUrl(`/fees/records/bulk-vouchers?${qs.toString()}`);
  },
};
