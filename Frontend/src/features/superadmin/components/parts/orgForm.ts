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

export const orgCreateValidators: Partial<Record<keyof OrgCreateValues, Validator>> = {
  name: orgName,
  code: orgCode,
  slug: orgSlug,
  themeColor: orgTheme,
  adminName: required('Principal name is required'),
  adminEmail: composeValidators(required('Principal email is required'), orgEmail),
  adminPassword: composeValidators(required('Password is required'), isPassword()),
  adminPhone: orgPhone,
  bankName: required('Bank name is required'),
  bankAccountTitle: required('Account title is required'),
  bankAccountNumber: required('Account number is required'),
  smtpUsername,
  smtpPassword,
  cloudName: (v, all) => {
    const name = String(v || '').trim();
    const key = String((all as Record<string, unknown>)?.cloudApiKey || '').trim();
    const secret = String((all as Record<string, unknown>)?.cloudApiSecret || '').trim();
    if (!name && !key && !secret) return undefined;
    if (!name) return 'Cloud Name is required';
    return undefined;
  },
  cloudApiKey: (v, all) => {
    const name = String((all as Record<string, unknown>)?.cloudName || '').trim();
    const key = String(v || '').trim();
    const secret = String((all as Record<string, unknown>)?.cloudApiSecret || '').trim();
    if (!name && !key && !secret) return undefined;
    if (!key) return 'API Key is required';
    return undefined;
  },
  cloudApiSecret: (v, all) => {
    const name = String((all as Record<string, unknown>)?.cloudName || '').trim();
    const key = String((all as Record<string, unknown>)?.cloudApiKey || '').trim();
    const secret = String(v || '').trim();
    if (!name && !key && !secret) return undefined;
    if (!secret) return 'API Secret is required';
    return undefined;
  },
};

