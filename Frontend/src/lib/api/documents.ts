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
    const blob = res.data as Blob;
    if (blob.type === 'application/json' || blob.size < 100) {
      const text = await blob.text();
      let parsed: { message?: string } | null = null;
      try { parsed = JSON.parse(text); } catch { /* not JSON */ }
      throw new Error(parsed?.message || 'TC generation failed');
    }
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Transfer-Certificate.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};
