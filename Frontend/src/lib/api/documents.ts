import { openPdf } from './pdfLinks';
import api from './client';

export const documentsApi = {
  feeVoucher: (id: string, size: 'a4' | 'a5' = 'a4') =>
    openPdf(`/documents/fee-voucher/${id}?size=${size}`),
  admissionSlip: (id: string) => openPdf(`/documents/admission-slip/${id}`),
  studentIdCard: (id: string) => openPdf(`/documents/student-id-card/${id}`),
  staffIdCard: (id: string) => openPdf(`/documents/staff-id-card/${id}`),
  staffQr: (id: string) => api.get<{ data: { qr: string } }>(`/documents/staff/${id}/qr`).then((r: any) => r.data.data.qr),

  issueTc: async (studentId: string, data: { reason: string; remarks?: string }): Promise<void> => {
    const res = await api.post(`/documents/tc/${studentId}`, data, { responseType: 'blob' });
    // Check if the response is actually JSON (error) by reading the blob as text
    const blob = res.data as Blob;
    if (blob.type === 'application/json' || blob.size < 100) {
      const text = await blob.text();
      try {
        const err = JSON.parse(text);
        throw new Error(err.message || 'TC generation failed');
      } catch (e: any) {
        if (e.message !== 'TC generation failed') throw new Error('TC generation failed');
        throw e;
      }
    }
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transfer-Certificate.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};
