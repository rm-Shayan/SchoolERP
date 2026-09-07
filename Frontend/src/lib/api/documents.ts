import { openPdf } from './pdfLinks';
import api from './client';

// Wrappers around openPdf() so callers don't hardcode document paths.
// All paths resolve to /api/v1/documents/* (api client adds the prefix).
export const documentsApi = {
  feeVoucher: (id: string, size: 'a4' | 'a5' = 'a4') =>
    openPdf(`/documents/fee-voucher/${id}?size=${size}`),
  admissionSlip: (id: string) => openPdf(`/documents/admission-slip/${id}`),
  studentIdCard: (id: string) => openPdf(`/documents/student-id-card/${id}`),
  staffIdCard: (id: string) => openPdf(`/documents/staff-id-card/${id}`),
  staffQr: (id: string) => api.get<{ data: { qr: string } }>(`/documents/staff/${id}/qr`).then((r: any) => r.data.data.qr),

  // Transfer Certificate — POST with body, returns PDF blob
  issueTc: async (studentId: string, data: { reason: string; remarks?: string }): Promise<void> => {
    const res = await api.post(`/documents/tc/${studentId}`, data, { responseType: 'blob' });
    const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transfer-Certificate.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};
