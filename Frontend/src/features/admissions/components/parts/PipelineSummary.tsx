'use client';

import { useMemo } from 'react';
import type { AdmissionStatus } from '@/types';
import type { AdmissionFunnelStats } from '@/lib/api/admissionService';
import { cn } from '@/lib/utils';
import { admissionStages } from '../../utils/admissionStages';

interface PipelineSummaryProps {
  funnel: AdmissionFunnelStats;
  active: AdmissionStatus | '';
  onSelect: (status: AdmissionStatus | '') => void;
}

const stageDot: Record<string, string> = {
  INQUIRY: 'bg-gray-400',
  TEST_SCHEDULED: 'bg-blue-400',
  TEST_PASSED: 'bg-green-500',
  TEST_FAILED: 'bg-red-400',
  FORM_SUBMITTED: 'bg-indigo-400',
  APPROVED: 'bg-emerald-500',
  FEE_PENDING: 'bg-yellow-500',
  ENROLLED: 'bg-green-600',
  REJECTED: 'bg-red-500',
};

export function PipelineSummary({ funnel, active, onSelect }: PipelineSummaryProps) {
  const stages = useMemo(() => {
    const ordered = admissionStages.map((s) => ({ status: s.status, label: s.label }));
    ordered.push({ status: 'TEST_FAILED', label: 'Test Failed' });
    ordered.push({ status: 'REJECTED', label: 'Rejected' });
    return ordered;
  }, []);

  const total = useMemo(() => funnel.total ?? 0, [funnel.total]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelect('')}
        className={cn(
          'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
          active === '' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        )}
      >
        All
        <span className="font-bold">{total}</span>
      </button>
      {stages.map((stage) => {
        const count = funnel[stage.status] ?? 0;
        const isActive = active === stage.status;
        return (
          <button
            key={stage.status}
            onClick={() => onSelect(isActive ? '' : stage.status)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              isActive ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            )}
          >
            <span className={cn('w-2 h-2 rounded-full', stageDot[stage.status])} />
            {stage.label}
            <span className="font-bold">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
