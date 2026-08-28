// ─────────────────────────────────────────────
// Shared client-side validation helpers
// Mirrors the backend zod schemas (src/modules/auth/auth.validation.js).
// ─────────────────────────────────────────────

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pakistani mobile number: optional +92 / 0092 / 92 / 0 prefix + 10 digits.
export const PHONE_PK_REGEX = /^(\+92|0092|92|0)?[0-9]{10}$/;

// Organization / branch codes (e.g. FALCON-01, GULSHAN_1) — relaxed on purpose,
// uniqueness is enforced server-side.
export const CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// URL-safe slug: lowercase alphanumerics separated by single dashes.
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhonePK(phone: string): boolean {
  const normalized = phone.replace(/[\s-]/g, '');
  return PHONE_PK_REGEX.test(normalized);
}

export function isValidOrgCode(code: string): boolean {
  const value = code.trim();
  return value.length >= 2 && CODE_REGEX.test(value);
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug.trim());
}

// Minimum password rule used by account creation forms (blank = auto-generated).
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Strong password rule used by change-password (matches backend regex).
export function hasStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type Validator = (value: unknown, values: Record<string, unknown>) => string | undefined;

export const required = (msg = 'This field is required'): Validator => (value) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '') ? msg : undefined;

export const minLength = (n: number, msg?: string): Validator => (value) =>
  typeof value === 'string' && value.length < n ? msg ?? `Must be at least ${n} characters` : undefined;

export const maxLength = (n: number, msg?: string): Validator => (value) =>
  typeof value === 'string' && value.length > n ? msg ?? `Must be at most ${n} characters` : undefined;

export const isEmail = (msg = 'Enter a valid email address'): Validator => (value) =>
  typeof value === 'string' && value !== '' && !isValidEmail(value) ? msg : undefined;

export const isPhonePK = (msg = 'Enter a valid phone number'): Validator => (value) =>
  typeof value === 'string' && value !== '' && !isValidPhonePK(value) ? msg : undefined;

export const isSlug = (msg = 'Only lowercase letters, numbers and dashes allowed'): Validator => (value) =>
  typeof value === 'string' && value !== '' && !isValidSlug(value) ? msg : undefined;

export const isOrgCode = (msg = 'Use letters, numbers, dash or dot (min 2 chars)'): Validator => (value) =>
  typeof value === 'string' && value !== '' && !isValidOrgCode(value) ? msg : undefined;

export const isNumber = (msg = 'Must be a number'): Validator => (value) =>
  value === '' || value === undefined || value === null || !isNaN(Number(value)) ? undefined : msg;

export const positiveNumber = (msg = 'Must be greater than zero'): Validator => (value) =>
  value === '' || value === undefined || value === null || Number(value) > 0 ? undefined : msg;

export const isPassword = (msg = 'Password must be at least 8 characters'): Validator => (value) =>
  typeof value === 'string' && value !== '' && !isValidPassword(value) ? msg : undefined;

export const strongPassword = (msg = 'Use 8+ chars with upper, lower and number'): Validator => (value) =>
  typeof value === 'string' && value !== '' && !hasStrongPassword(value) ? msg : undefined;

export function composeValidators(...validators: Validator[]): Validator {
  return (value, values) => {
    for (const fn of validators) {
      const msg = fn(value, values);
      if (msg) return msg;
    }
    return undefined;
  };
}
