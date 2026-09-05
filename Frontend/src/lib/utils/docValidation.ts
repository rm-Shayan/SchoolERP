// Document upload validation (mirrors backend storage.service.js rules).
// Allowed: PDF, JPG, PNG, WebP. No strict frontend limit — backend enforces.

const MAX_DOC_UPLOAD_SIZE_MB = 50;
const ALLOWED_DOC_TYPES = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
]);

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateDocumentUpload(file: File) {
  if (!ALLOWED_DOC_TYPES.has(file.type)) {
    return 'Only PDF, JPG, PNG and WebP documents are allowed';
  }
  const maxBytes = MAX_DOC_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Document is too large (${fmtSize(file.size)}). Maximum size is ${MAX_DOC_UPLOAD_SIZE_MB} MB.`;
  }
  return '';
}
