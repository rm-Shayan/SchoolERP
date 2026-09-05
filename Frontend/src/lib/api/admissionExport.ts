import api from './client';
import type { AdmissionListParams } from './admissionService';

// CSV export for the admissions list — separated so admissionService stays
// under the 150-line file limit. Public API remains admissionService.exportCsv.
export async function exportAdmissionsCsv(params: Omit<AdmissionListParams, 'page' | 'pageSize'>): Promise<void> {
  const res = await api.get<string>('/admissions/export', { params, responseType: 'text' });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `admissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}