export const ROW_H = 56;

export const CHIPS = ['ALL', 'PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'MANUAL_OVERRIDE'] as const;
export type Chip = (typeof CHIPS)[number];

export const BADGE: Record<string, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  ABSENT: 'bg-red-50 text-red-700 border-red-200',
  LEAVE: 'bg-blue-50 text-blue-700 border-blue-200',
  MANUAL_OVERRIDE: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const DOT: Record<string, string> = {
  PRESENT: 'bg-emerald-400',
  LATE: 'bg-amber-400',
  ABSENT: 'bg-red-400',
  LEAVE: 'bg-blue-400',
  MANUAL_OVERRIDE: 'bg-purple-400',
};

export const time = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—';
