'use client';

import { memo } from 'react';
import type { Applicant } from '@/types';
import { formatDate } from '@/lib/utils';
import AvatarPlaceholder from '@/features/shared/components/AvatarPlaceholder';
import { getStage } from '../../utils/admissionStages';
import { documentsApi } from '@/lib/api/documents';
import AdmissionsQuickActions from './AdmissionsQuickActions';

interface AdmissionsRowProps {
  applicant: Applicant;
  onView: (applicant: Applicant) => void;
  onEdit: (applicant: Applicant) => void;
  onRefresh: () => void;
}

const stageBadge: Record<string, string> = {
  INQUIRY: 'bg-gray-100 text-gray-600 ring-gray-200',
  TEST_SCHEDULED: 'bg-primary-50 text-primary-600 ring-primary-200',
  TEST_PASSED: 'bg-green-50 text-green-600 ring-green-200',
  TEST_FAILED: 'bg-red-50 text-red-600 ring-red-200',
  FORM_SUBMITTED: 'bg-primary-50 text-primary-600 ring-primary-200',
  APPROVED: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  FEE_PENDING: 'bg-amber-50 text-amber-600 ring-amber-200',
  ENROLLED: 'bg-green-50 text-green-700 ring-green-200',
  REJECTED: 'bg-red-50 text-red-600 ring-red-200',
};

const stageDots: Record<string, string> = {
  INQUIRY: 'bg-gray-400',
  TEST_SCHEDULED: 'bg-primary-500',
  TEST_PASSED: 'bg-green-500',
  TEST_FAILED: 'bg-red-400',
  FORM_SUBMITTED: 'bg-primary-500',
  APPROVED: 'bg-emerald-500',
  FEE_PENDING: 'bg-amber-500',
  ENROLLED: 'bg-green-600',
  REJECTED: 'bg-red-500',
};

function AdmissionsRowInner({ applicant, onView, onEdit, onRefresh }: AdmissionsRowProps) {
  const stage = getStage(applicant.status);
  const name = `${applicant.firstName} ${applicant.lastName}`;
  const testSlot =
    applicant.status === 'TEST_SCHEDULED' && applicant.testDate
      ? `${formatDate(applicant.testDate)}${applicant.testTime ? ` · ${applicant.testTime}` : ''}`
      : (applicant.status === 'TEST_PASSED' || applicant.status === 'TEST_FAILED') && applicant.testMarks
        ? `Marks: ${applicant.testMarks}`
        : '—';

  return (
    <tr
      className="group hover:bg-primary-50/30 transition-colors cursor-pointer"
      onClick={() => onView(applicant)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {applicant.imageUrl ? (
            <img src={applicant.imageUrl} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-gray-100" />
          ) : (
            <AvatarPlaceholder className="w-9 h-9 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{applicant.parentWhatsappNo}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-700">{applicant.class?.name ?? '—'}</td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700 truncate">{applicant.parentName}</p>
        {applicant.parentEmail && <p className="text-xs text-gray-500 truncate">{applicant.parentEmail}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{testSlot}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${stageBadge[applicant.status] ?? 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${stageDots[applicant.status] ?? 'bg-gray-400'}`} />
          {stage.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 tabular-nums">{formatDate(applicant.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <AdmissionsQuickActions applicant={applicant} onOpen={onView} onRefresh={onRefresh} />
          <button onClick={() => onEdit(applicant)} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors sm:opacity-0 sm:group-hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => documentsApi.admissionSlip(applicant.id)} title="Download slip" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
            Slip
          </button>
        </div>
      </td>
    </tr>
  );
}

export const AdmissionsRow = memo(AdmissionsRowInner);
