'use client';

import type { AdmissionStatus } from '@/types';
import { cn } from '@/lib/utils';
import { admissionStages } from '../../utils/admissionStages';

interface StageProgressProps {
  current: AdmissionStatus;
}

const STEPS = admissionStages.filter((s) => s.status !== 'INQUIRY');

const STATUS_INDEX: Record<string, number> = {
  INQUIRY: 0,
  TEST_SCHEDULED: 1,
  TEST_PASSED: 2,
  TEST_FAILED: -1,
  FORM_SUBMITTED: 3,
  APPROVED: 4,
  FEE_PENDING: 5,
  ENROLLED: 6,
  REJECTED: -1,
};

const STATUS_COLORS: Record<string, { dot: string; line: string }> = {
  TEST_SCHEDULED: { dot: 'bg-primary-500', line: 'bg-primary-400' },
  TEST_PASSED: { dot: 'bg-green-500', line: 'bg-green-400' },
  FORM_SUBMITTED: { dot: 'bg-indigo-500', line: 'bg-indigo-400' },
  APPROVED: { dot: 'bg-emerald-500', line: 'bg-emerald-400' },
  FEE_PENDING: { dot: 'bg-amber-500', line: 'bg-amber-400' },
  ENROLLED: { dot: 'bg-green-600', line: 'bg-green-500' },
};

export function StageProgress({ current }: StageProgressProps) {
  const idx = STATUS_INDEX[current] ?? 0;
  const isRejected = current === 'TEST_FAILED' || current === 'REJECTED';

  return (
    <div className="px-1 py-2">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const reached = !isRejected && idx >= i;
          const isCurrent = current === step.status;
          const colors = STATUS_COLORS[step.status] ?? { dot: 'bg-gray-400', line: 'bg-gray-300' };

          return (
            <div key={step.status} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn('w-3 h-3 rounded-full transition-colors', reached ? colors.dot : 'bg-gray-200', isCurrent && 'ring-2 ring-offset-1 ring-primary-300')} />
                <span className={cn('text-[9px] mt-1 font-medium whitespace-nowrap', reached ? 'text-gray-700' : 'text-gray-400')}>
                  {step.label.length > 8 ? step.label.slice(0, 8) + '…' : step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-0.5 flex-1 mx-1 rounded-full transition-colors', i < idx ? colors.line : 'bg-gray-200')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
