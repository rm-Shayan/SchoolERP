import {
  composeValidators,
  isOrgCode,
  isPassword,
  isValidEmail,
  isValidPhonePK,
  isValidSlug,
  required,
  type Validator,
} from '@/lib/utils';

export interface OrgCreateValues {
  name: string;
  code: string;
  slug: string;
  logoUrl: string;
  themeColor: string;
  adminEmail: string;
  adminName: string;
  adminUsername: string;
  adminPassword: string;
  adminPhone: string;
  smtpUsername: string;
  smtpPassword: string;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  cloudName: string;
  cloudApiKey: string;
  cloudApiSecret: string;
}

export const initialOrgCreate = (): OrgCreateValues => ({
  name: '',
  code: '',
  slug: '',
  logoUrl: '',
  themeColor: '#2563eb',
  adminEmail: '',
  adminName: '',
  adminUsername: '',
  adminPassword: '',
  adminPhone: '',
  smtpUsername: '',
  smtpPassword: '',
  bankName: '',
  bankAccountTitle: '',
  bankAccountNumber: '',
  cloudName: '',
  cloudApiKey: '',
  cloudApiSecret: '',
});

const orgName: Validator = (value) => {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) return 'Organization name is required';
  return name.length >= 2 ? undefined : 'Name must be at least 2 characters';
};

const orgCode: Validator = composeValidators(
  required('Code is required'),
  isOrgCode('Use letters, numbers, dash or underscore (e.g. FALCON-01)')
);

const orgSlug: Validator = (value) => {
  const slug = typeof value === 'string' ? value.trim() : '';
  return slug !== '' && !isValidSlug(slug)
    ? 'Lowercase letters, numbers and dashes only (e.g. falcon-academy)'
    : undefined;
};

const orgEmail: Validator = (value) => {
  const email = typeof value === 'string' ? value.trim() : '';
  return email !== '' && !isValidEmail(email) ? 'Enter a valid email address' : undefined;
};

const orgPhone: Validator = (value) => {
  const phone = typeof value === 'string' ? value.trim() : '';
  return phone !== '' && !isValidPhonePK(phone)
    ? 'Enter a valid Pakistani mobile number (e.g. 03001234567)'
    : undefined;
};

const orgTheme: Validator = (value) => {
  const theme = typeof value === 'string' ? value.trim() : '';
  return theme !== '' && !/^#[0-9a-fA-F]{6}$/.test(theme)
    ? 'Enter a hex color like #2563eb'
    : undefined;
};

// SMTP pair optional hai — dono ya koi ek nahi. Gmail App Password = 16 chars.
const smtpUsername: Validator = (value, all) => {
  const u = String(value || '').trim();
  const passFilled = String((all as Record<string, unknown>)?.smtpPassword || '').trim() !== '';
  if (!u) return passFilled ? 'SMTP email is required when App Password is set' : undefined;
  return isValidEmail(u) ? undefined : 'Enter a valid email address';
};

const smtpPassword: Validator = (value, all) => {
  const user = String((all as Record<string, unknown>)?.smtpUsername || '').trim();
  const p = String(value || '').replace(/\s+/g, '');
  if (!user && !p) return undefined;
  if (user && !p) return 'App Password is required when SMTP email is set';
  return p.length === 16 ? undefined : 'Gmail App Password has exactly 16 characters';
};

// No static validators — all validation done manually in onSubmit
export const orgCreateValidators: Partial<Record<keyof OrgCreateValues, Validator>> = {};

/** Manual validation for ALL fields (called from onSubmit) */
export function validateOrgCreateFields(v: OrgCreateValues, adminMode: 'new' | 'existing'): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.name?.trim()) e.name = 'Organization name is required';
  else if (v.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
  if (!v.code?.trim()) e.code = 'Code is required';
  if (v.slug?.trim() && !isValidSlug(v.slug.trim())) e.slug = 'Lowercase letters, numbers and dashes only';
  if (adminMode === 'new') {
    if (!v.adminName?.trim()) e.adminName = 'Principal name is required';
    if (!v.adminEmail?.trim()) e.adminEmail = 'Principal email is required';
    else if (!isValidEmail(v.adminEmail.trim())) e.adminEmail = 'Enter a valid email';
    if (!v.adminPassword?.trim()) e.adminPassword = 'Password is required';
    else if (v.adminPassword.length < 5) e.adminPassword = 'Password must be at least 5 characters';
  } else {
    if (!v.adminEmail?.trim()) e.adminEmail = 'Select an admin or enter email';
  }
  if (!v.bankName?.trim()) e.bankName = 'Bank name is required';
  if (!v.bankAccountTitle?.trim()) e.bankAccountTitle = 'Account title is required';
  if (!v.bankAccountNumber?.trim()) e.bankAccountNumber = 'Account number is required';
  return e;
}

