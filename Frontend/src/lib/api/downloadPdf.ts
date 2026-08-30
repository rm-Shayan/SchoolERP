'use client';

import api from './client';
import type { AxiosResponse } from 'axios';

export function saveBlob(data: BlobPart, filename: string) {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPdf(path: string, filename: string) {
  const res: AxiosResponse = await api.get(path, { responseType: 'blob' });
  saveBlob(res.data as BlobPart, filename);
}