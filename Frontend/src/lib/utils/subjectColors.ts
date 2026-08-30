/** Deterministic color palette for timetable subject cells. */
const PALETTE = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', sub: 'text-blue-500', dot: 'bg-blue-400' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', sub: 'text-emerald-500', dot: 'bg-emerald-400' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', sub: 'text-violet-500', dot: 'bg-violet-400' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', sub: 'text-amber-500', dot: 'bg-amber-400' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', sub: 'text-rose-500', dot: 'bg-rose-400' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', sub: 'text-cyan-500', dot: 'bg-cyan-400' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', sub: 'text-pink-500', dot: 'bg-pink-400' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', sub: 'text-teal-500', dot: 'bg-teal-400' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', sub: 'text-orange-500', dot: 'bg-orange-400' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', sub: 'text-indigo-500', dot: 'bg-indigo-400' },
] as const;

function hash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getSubjectColor(name: string | undefined | null) {
  if (!name) return PALETTE[0];
  return PALETTE[hash(name) % PALETTE.length];
}
