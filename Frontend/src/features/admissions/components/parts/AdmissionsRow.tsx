'use client';

import { memo } from 'react';
import type { Applicant } from '@/types';
import { formatDate } from '@/lib/utils';
import { getStage } from '../../utils/admissionStages';
import { documentsApi } from '@/lib/api/documents';

interface AdmissionsRowProps {
  applicant: Applicant;
  onView: (applicant: Applicant) => void;
  onEdit: (applicant: Applicant) => void;
}

const stageBadge: Record<string, string> = {
  INQUIRY: 'bg-gray-100 text-gray-700',
  TEST_SCHEDULED: 'bg-blue-100 text-blue-700',
  TEST_PASSED: 'bg-green-100 text-green-700',
  TEST_FAILED: 'bg-red-100 text-red-700',
  FORM_SUBMITTED: 'bg-indigo-100 text-indigo-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  FEE_PENDING: 'bg-yellow-100 text-yellow-700',
  ENROLLED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
};

function AdmissionsRowInner({ applicant, onView, onEdit }: AdmissionsRowProps) {
  const stage = getStage(applicant.status);
  const name = `${applicant.firstName} ${applicant.lastName}`;
  const initials = `${applicant.firstName.charAt(0)}${applicant.lastName.charAt(0)}`.toUpperCase();
  const testSlot =
    applicant.status === 'TEST_SCHEDULED' && applicant.testDate
      ? `${formatDate(applicant.testDate)}${applicant.testTime ? ` · ${applicant.testTime}` : ''}`
      : (applicant.status === 'TEST_PASSED' || applicant.status === 'TEST_FAILED') && applicant.testMarks
        ? `Marks: ${applicant.testMarks}`
        : '—';

  return (
    <tr className="group hover:bg-primary-50/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {applicant.imageUrl ? (
            <img
              src={applicant.imageUrl}
              alt={name}
              loading="lazy"
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-gray-100"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
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
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stageBadge[applicant.status] ?? 'bg-gray-100 text-gray-700'}`}>
          {stage.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 tabular-nums">{formatDate(applicant.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(applicant)}
            title="View details"
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          {applicant.status !== 'ENROLLED' && (
            <button
              onClick={() => onEdit(applicant)}
              title="Edit applicant"
              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => documentsApi.admissionSlip(applicant.id)}
            title="Download admission slip"
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

export const AdmissionsRow = memo(AdmissionsRowInner);
