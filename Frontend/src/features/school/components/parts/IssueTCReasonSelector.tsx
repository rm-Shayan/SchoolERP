'use client';

import type { Student } from '@/types';
import { Badge } from '@/features/shared/components';

const REASONS = [
  { value: 'TRANSFERRED_OUT', label: 'Transfer to Another School', description: 'Student is leaving for another school.', variant: 'warning' as const },
  { value: 'DROPPED_OUT', label: 'Drop Out', description: 'Student is leaving school permanently.', variant: 'danger' as const },
  { value: 'GRADUATED', label: 'Passed Out / Graduated', description: 'Student has completed the final class.', variant: 'info' as const },
] as const;

interface Props {
  reason: string;
  onReason: (v: string) => void;
  canIssue: boolean;
  isReceptionist: boolean;
}

export default function ReasonSelector({ reason, onReason, canIssue, isReceptionist }: Props) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Reason for Leaving *</label>
      <div className="space-y-2">
        {REASONS.map((r) => (
          <label key={r.value} className={`relative flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all duration-200 ${reason === r.value ? 'border-primary-500 bg-primary-50/70 shadow-md shadow-primary-500/20 ring-2 ring-primary-200/40' : 'border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
            {reason === r.value && <span className="absolute -top-2.5 -right-2.5 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">Selected</span>}
            <input type="radio" name="tc-reason" value={r.value} checked={reason === r.value} onChange={(e) => onReason(e.target.value)} className="mt-0.5 h-4 w-4 text-primary-600 accent-primary-600" disabled={!canIssue} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                <Badge variant={r.variant}>{r.value.replace('_', ' ')}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
            </div>
          </label>
        ))}
      </div>
      {isReceptionist && !canIssue && <p className="mt-2 text-xs text-red-600">This student is not active, so TC cannot be issued from the receptionist view.</p>}
    </div>
  );
}

export function ImpactBanner({ selectedLabel }: { selectedLabel: string }) {
  const items = [
    `Student status will change to ${selectedLabel}.`,
    'Student + parent portal access will be deactivated.',
    'Student photo will be moved to archive.',
    'A Transfer Certificate PDF will be generated and downloaded.',
  ];
  return (
    <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 p-4">
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">What happens after issuing</p>
      <ul className="space-y-1.5 text-xs text-amber-800">
        {items.map((t) => <li key={t} className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" /><span>{t}</span></li>)}
      </ul>
    </div>
  );
}
