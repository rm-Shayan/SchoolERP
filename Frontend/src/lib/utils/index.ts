import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserType } from '@/types';
export * from './validation';
export * from './useForm';
export * from './useDebouncedValue';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extract the clean error message from the backend — never expose error codes/status, with fallback included.
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { response?: { data?: { message?: unknown } }; message?: unknown };
  const msg = e?.response?.data?.message ?? e?.message;
  if (typeof msg === 'string' && msg.trim() !== '' && !msg.startsWith('Request failed with status code')) {
    return msg;
  }
  return fallback;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    GRADUATED: 'bg-primary-100 text-primary-800',
    DROPPED_OUT: 'bg-red-100 text-red-800',
    TRANSFERRED_OUT: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    UNPAID: 'bg-red-100 text-red-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    OVERDUE: 'bg-red-100 text-red-800',
    PRESENT: 'bg-green-100 text-green-800',
    ABSENT: 'bg-red-100 text-red-800',
    LATE: 'bg-yellow-100 text-yellow-800',
    LEAVE: 'bg-primary-100 text-primary-800',
    ENROLLED: 'bg-green-100 text-green-800',
    INQUIRY: 'bg-gray-100 text-gray-800',
    TEST_SCHEDULED: 'bg-primary-100 text-primary-800',
    TEST_PASSED: 'bg-green-100 text-green-800',
    TEST_FAILED: 'bg-red-100 text-red-800',
    FORM_SUBMITTED: 'bg-indigo-100 text-indigo-800',
    APPROVED: 'bg-green-100 text-green-800',
    FEE_PENDING: 'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Principal / Admin',
    TEACHER: 'Teacher',
    RECEPTIONIST: 'Receptionist',
  };
  return labels[role] || role;
}

export function getUserType(role?: string): UserType | null {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'SUPERADMIN';
    case 'TEACHER':
      return 'TEACHER';
    case 'ADMIN':
    case 'RECEPTIONIST':
      return 'ADMIN';
    default:
      return null;
  }
}

// Mirrors backend storage rules: MAX_IMAGE_UPLOAD_SIZE_MB (default 5MB),
// JPG/PNG/WebP + HEIC (iPhone, converted server-side). Keep in sync with storage.service.js.
// Frontend allows 10MB — compression handles the rest.
export const MAX_IMAGE_UPLOAD_SIZE_MB = 10;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateImageUpload(file: File, maxSizeMB = MAX_IMAGE_UPLOAD_SIZE_MB) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Please upload a JPG, PNG or WebP image (iPhone HEIC photos are supported)';
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Image is too large (${formatFileSize(file.size)}). Please upload an image under ${maxSizeMB} MB. Images are automatically compressed to save storage.`;
  }

  return '';
}

export { validateDocumentUpload } from './docValidation';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Slug-maintained home paths: all org portal URLs use /o/{slug}/... format
// so the branded URL persists throughout the session (slug is never dropped).
// SUPER_ADMIN is the sole platform owner (only one) — always navigates to the platform console.
export function getRoleHomePath(role?: string, _organizationId?: string, slug?: string): string {
  const base = slug ? `/o/${slug}` : '';
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'ADMIN':
    case 'RECEPTIONIST':
      return `${base}/branch/dashboard`;
    case 'TEACHER':
      return `${base}/teacher/dashboard`;
    default:
      return '/login';
  }
}
