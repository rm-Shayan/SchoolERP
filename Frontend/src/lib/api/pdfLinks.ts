'use client';

import api from './client';

/**
 * Fetch a PDF via the authed axios client (Authorization header attached) and
 * open it in a new tab. Raw `<a href="/api/v1/...">` links fail with 401
 * because a browser navigation carries no token — this helper fixes that bug
 * (voucher / receipt / admission slip).
 */
export async function openPdf(path: string): Promise<void> {
  const res = await api.get(path, { responseType: 'blob' });
  const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfFilename(path);
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the new tab time to render the PDF — revoking immediately causes
  // some browsers to show a blank page.
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

/**
 * Fetch a PDF and return an object URL for inline viewing (no download).
 * Used by the voucher "View" action — opens inside the app instead of saving
 * a file. Caller is responsible for revoking the URL when done.
 */
export async function fetchPdfUrl(path: string): Promise<string> {
  const res = await api.get(path, { responseType: 'blob' });
  const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

function pdfFilename(path: string): string {
  const cleanPath = path.split('?')[0];
  if (cleanPath.includes('bulk-vouchers')) return 'fee-vouchers-bulk.pdf';
  if (cleanPath.includes('/slip')) return 'admission-slip.pdf';
  if (cleanPath.includes('voucher')) return 'fee-voucher.pdf';
  if (cleanPath.includes('receipt')) return 'fee-receipt.pdf';
  return 'document.pdf';
}
