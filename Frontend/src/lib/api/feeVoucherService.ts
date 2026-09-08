import { openPdf, fetchPdfUrl } from './pdfLinks';

export const feeVoucherService = {
  getReceiptPdf: async (feeRecordId: string): Promise<void> => {
    await openPdf(`/documents/fee-voucher/${feeRecordId}`);
  },

  getVoucherPdf: async (feeRecordId: string, recordIds?: string[]): Promise<void> => {
    const q = recordIds?.length ? `?merge=1&recordIds=${recordIds.join(',')}` : '?merge=1';
    await openPdf(`/documents/fee-voucher/${feeRecordId}${q}`);
  },

  getVoucherViewUrl: async (feeRecordId: string, recordIds?: string[]): Promise<string> => {
    const q = recordIds?.length ? `?merge=1&recordIds=${recordIds.join(',')}` : '?merge=1';
    return fetchPdfUrl(`/documents/fee-voucher/${feeRecordId}${q}`);
  },

  getVoucherA5Pdf: async (feeRecordId: string, recordIds?: string[]): Promise<void> => {
    const q = recordIds?.length ? `?size=a5&merge=1&recordIds=${recordIds.join(',')}` : '?size=a5&merge=1';
    await openPdf(`/documents/fee-voucher/${feeRecordId}${q}`);
  },

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
