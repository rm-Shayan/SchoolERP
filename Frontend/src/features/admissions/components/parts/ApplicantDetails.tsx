'use client';

import { useRef } from 'react';
import type { Applicant } from '@/types';
import { Button } from '@/features/shared/components';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ApplicantDetailsProps {
  applicant: Applicant;
  busy: boolean;
  onPhoto: (file: File) => void;
}

export function ApplicantDetails({ applicant, busy, onPhoto }: ApplicantDetailsProps) {
  const photoRef = useRef<HTMLInputElement>(null);
  const name = `${applicant.firstName} ${applicant.lastName}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {applicant.imageUrl ? (
          <img src={applicant.imageUrl} alt="applicant" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold shrink-0">
            {applicant.firstName.charAt(0)}{applicant.lastName.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ''; }} />
          <Button size="sm" variant="outline" loading={busy} onClick={() => photoRef.current?.click()}>
            {applicant.imageUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          <p className="text-[11px] text-gray-400 mt-1">It will carry over to the student record upon enrollment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div><p className="text-gray-500 mb-0.5">Class</p><p className="font-medium text-gray-900">{applicant.class?.name ?? '—'}</p></div>
        <div><p className="text-gray-500 mb-0.5">Gender</p><p className="font-medium text-gray-900 capitalize">{applicant.gender?.toLowerCase() ?? '—'}</p></div>
        <div><p className="text-gray-500 mb-0.5">Parent</p><p className="font-medium text-gray-900">{applicant.parentName}</p></div>
        <div><p className="text-gray-500 mb-0.5">WhatsApp</p><p className="font-medium text-gray-900">{applicant.parentWhatsappNo}</p></div>
        {applicant.parentEmail && (
          <div className="col-span-2"><p className="text-gray-500 mb-0.5">Email</p><p className="font-medium text-gray-900">{applicant.parentEmail}</p></div>
        )}
        {applicant.status === 'TEST_SCHEDULED' && applicant.testDate && (
          <div className="col-span-2">
            <p className="text-gray-500 mb-0.5">Test Slot</p>
            <p className="font-medium text-gray-900">
              {formatDate(applicant.testDate)}
              {applicant.testTime ? ` · ${applicant.testTime}` : ''}
              {applicant.testVenue ? ` — ${applicant.testVenue}` : ''}
            </p>
          </div>
        )}
        {(applicant.status === 'TEST_PASSED' || applicant.status === 'TEST_FAILED') && applicant.testMarks && (
          <div className="col-span-2"><p className="text-gray-500 mb-0.5">Test Marks</p><p className="font-medium text-gray-900">{applicant.testMarks}</p></div>
        )}
        {applicant.advanceFeeAmount != null && (
          <div className="col-span-2"><p className="text-gray-500 mb-0.5">Advance Fee</p><p className="font-medium text-gray-900">{formatCurrency(applicant.advanceFeeAmount)}</p></div>
        )}
      </div>

      <p className="text-xs text-gray-400">{name} · registered {formatDate(applicant.createdAt)}</p>
    </div>
  );
}
