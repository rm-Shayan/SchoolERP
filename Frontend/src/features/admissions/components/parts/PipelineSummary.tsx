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

const STAGE_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  INQUIRY: { bar: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' },
  TEST_SCHEDULED: { bar: 'bg-primary-500', bg: 'bg-primary-50', text: 'text-primary-700' },
  TEST_PASSED: { bar: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  TEST_FAILED: { bar: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-600' },
  FORM_SUBMITTED: { bar: 'bg-primary-500', bg: 'bg-primary-50', text: 'text-primary-700' },
  APPROVED: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  FEE_PENDING: { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  ENROLLED: { bar: 'bg-green-600', bg: 'bg-green-50', text: 'text-green-800' },
  REJECTED: { bar: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
};

export function PipelineSummary({ funnel, active, onSelect }: PipelineSummaryProps) {
  const total = funnel.total ?? 0;

  const stages = useMemo(() => {
    const base = admissionStages.map((s) => ({ status: s.status, label: s.label }));
    base.push({ status: 'TEST_FAILED', label: 'Failed' });
    base.push({ status: 'REJECTED', label: 'Rejected' });
    return base;
  }, []);

  return (
    <div className="space-y-2">
      <button
        onClick={() => onSelect('')}
        className={cn(
          'w-full flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
          active === ''
            ? 'border-primary-300 bg-primary-50 text-primary-700 shadow-sm'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <span>All Applicants</span>
        <span className="font-bold tabular-nums">{total}</span>
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {stages.map((stage) => {
          const count = funnel[stage.status] ?? 0;
          const isActive = active === stage.status;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const colors = STAGE_COLORS[stage.status] ?? STAGE_COLORS.INQUIRY;

          return (
            <button
              key={stage.status}
              onClick={() => onSelect(isActive ? '' : stage.status)}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-left transition-all',
                isActive
                  ? 'border-primary-300 bg-primary-50 shadow-sm ring-1 ring-primary-200'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn('text-xs font-medium', colors.text)}>{stage.label}</span>
                <span className="text-xs font-bold tabular-nums text-gray-900">{count}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', colors.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 tabular-nums">{pct}%</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
