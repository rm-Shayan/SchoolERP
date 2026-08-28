export type AuthVariant = 'primary' | 'slate' | 'secondary' | 'superadmin';

export const themes = {
  primary: {
    panel: 'from-primary-700 via-primary-600 to-primary-500',
    iconBox: 'bg-white/15 backdrop-blur-sm',
    badge: 'border-white/20 bg-white/10 text-primary-50 backdrop-blur-sm',
    brandSubText: 'text-primary-100',
    descriptionText: 'text-primary-50/90',
    featureChip: 'border-white/15 bg-white/10 text-white/90',
    featureIconBg: 'bg-white/20',
  },
  slate: {
    panel: 'from-slate-950 via-slate-900 to-primary-900',
    iconBox: 'bg-primary-500/20 ring-1 ring-white/10',
    badge: 'border-primary-400/30 bg-primary-500/10 text-primary-100',
    brandSubText: 'text-slate-300',
    descriptionText: 'text-slate-300',
    featureChip: 'border-white/10 bg-white/5 text-slate-200',
    featureIconBg: 'bg-primary-500/20 text-primary-100',
  },
  secondary: {
    panel: 'from-secondary-700 via-secondary-600 to-secondary-500',
    iconBox: 'bg-white/15 backdrop-blur-sm',
    badge: 'border-white/20 bg-white/10 text-secondary-50 backdrop-blur-sm',
    brandSubText: 'text-secondary-100',
    descriptionText: 'text-secondary-50/90',
    featureChip: 'border-white/15 bg-white/10 text-white/90',
    featureIconBg: 'bg-white/20',
  },
  superadmin: {
    panel: 'from-[#1e1b4b] via-[#312e81] to-[#5b21b6]',
    iconBox: 'bg-white/15 ring-1 ring-white/25 shadow-lg shadow-black/20',
    badge: 'border-primary-400/50 bg-primary-500/20 text-primary-50 backdrop-blur-sm',
    brandSubText: 'text-primary-200',
    descriptionText: 'text-slate-200/90',
    featureChip: 'border-white/15 bg-white/8 text-slate-100 shadow-sm',
    featureIconBg: 'bg-primary-500/30 text-primary-100',
  },
} as const;

export const mobileIconBox: Record<AuthVariant, string> = {
  primary: 'bg-primary-600 shadow-primary-600/20',
  slate: 'bg-slate-900 shadow-slate-900/20',
  secondary: 'bg-secondary-600 shadow-secondary-600/20',
  superadmin: 'bg-primary-600 shadow-primary-600/20',
};

// Darken a hex color for the gradient's deep end
export const darkenHex = (hex: string) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return undefined;
  const r = Math.max(0, (n >> 16) - 34);
  const g = Math.max(0, ((n >> 8) & 0xff) - 34);
  const b = Math.max(0, (n & 0xff) - 34);
  return `#${((r << 16) + (g << 8) + b).toString(16).padStart(6, '0')}`;
};
