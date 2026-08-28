import { openPdf } from './pdfLinks';
import client from './client';

// Wrappers around openPdf() so callers don't hardcode document paths.
// All paths resolve to /api/v1/documents/* (api client adds the prefix).
export const documentsApi = {
  feeVoucher: (id: string, size: 'a4' | 'a5' = 'a4') =>
    openPdf(`/documents/fee-voucher/${id}?size=${size}`),
  admissionSlip: (id: string) => openPdf(`/documents/admission-slip/${id}`),
  studentIdCard: (id: string) => openPdf(`/documents/student-id-card/${id}`),
  staffIdCard: (id: string) => openPdf(`/documents/staff-id-card/${id}`),
  staffQr: (id: string) => client.get<{ data: { qr: string } }>(`/documents/staff/${id}/qr`).then((r) => r.data.data.qr),
};
