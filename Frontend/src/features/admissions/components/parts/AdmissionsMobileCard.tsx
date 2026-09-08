'use client';

import { memo } from 'react';
import type { Applicant } from '@/types';
import { getStage } from '../../utils/admissionStages';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';
import { documentsApi } from '@/lib/api/documents';
import AdmissionsQuickActions from './AdmissionsQuickActions';

interface AdmissionsMobileCardProps {
  applicant: Applicant;
  onView: (applicant: Applicant) => void;
  onEdit: (applicant: Applicant) => void;
  onRefresh: () => void;
}

const stageBadge: Record<string, string> = {
  INQUIRY: 'bg-gray-100 text-gray-700',
  TEST_SCHEDULED: 'bg-primary-100 text-primary-700',
  TEST_PASSED: 'bg-green-100 text-green-700',
  TEST_FAILED: 'bg-red-100 text-red-700',
  FORM_SUBMITTED: 'bg-primary-100 text-primary-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  FEE_PENDING: 'bg-yellow-100 text-yellow-700',
  ENROLLED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
};

function AdmissionsMobileCardInner({ applicant, onView, onEdit, onRefresh }: AdmissionsMobileCardProps) {
  const stage = getStage(applicant.status);
  const name = `${applicant.firstName} ${applicant.lastName}`;

  return (
    <div className="px-4 py-3 hover:bg-primary-50/40 transition-colors">
      <div className="flex items-start gap-3">
        {applicant.imageUrl ? (
          <img src={applicant.imageUrl} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <AvatarPlaceholder className="w-10 h-10 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${stageBadge[applicant.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {stage.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-500">{applicant.class?.name ?? '—'}</p>
            <span className="text-gray-300">·</span>
            <p className="text-xs text-gray-500 truncate">{applicant.parentName}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-2">
        <AdmissionsQuickActions applicant={applicant} onOpen={onView} onRefresh={onRefresh} />
        <button onClick={() => onView(applicant)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="View">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
        {applicant.status !== 'ENROLLED' && (
          <button onClick={() => onEdit(applicant)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Edit">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
        )}
        <button onClick={() => documentsApi.admissionSlip(applicant.id)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-colors" title="Download slip">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
          Slip
        </button>
      </div>
    </div>
  );
}

export const AdmissionsMobileCard = memo(AdmissionsMobileCardInner);
