'use client';

import api from './client';

/** A blob that is actually a JSON error body (axios responseType 'blob'). */
export function isErrorBlob(data: unknown): data is Blob {
  return data instanceof Blob && (data.type.includes('json') || data.size < 100);
}

/** Extract a server error message from an error blob, if possible. */
export async function errorMessageFromBlob(blob: Blob, fallback: string): Promise<string> {
  try {
    const text = await blob.text();
    const parsed: { message?: string } | null = JSON.parse(text);
    return parsed?.message || fallback;
  } catch {
    return fallback;
  }
}

/** Wrap an axios data blob as a PDF blob and trigger a download. */
export function downloadPdfBlob(data: unknown, filename: string): void {
  const blob = new Blob([data as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke only after the download has started — immediate revoke can blank
  // the PDF in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

/**
 * Fetch a PDF via the authed axios client (Authorization header attached) and
 * open it in a new tab. Raw `<a href="/api/v1/...">` links fail with 401
 * because a browser navigation carries no token — this helper fixes that bug
 * (voucher / receipt / admission slip). Error bodies are surfaced instead of
 * silently downloading a broken file.
 */
export async function openPdf(path: string): Promise<void> {
  const res = await api.get(path, { responseType: 'blob' });
  if (isErrorBlob(res.data)) {
    throw new Error(await errorMessageFromBlob(res.data as Blob, 'Failed to generate document'));
  }
  downloadPdfBlob(res.data, pdfFilename(path));
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
