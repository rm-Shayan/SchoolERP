'use client';

import { useState } from 'react';
import { admissionService } from '@/lib/api';
import type { Applicant, AdmissionStatus } from '@/types';
import toast from 'react-hot-toast';

interface AdmissionsQuickActionsProps {
  applicant: Applicant;
  /** Opens the full pipeline modal (schedule test / fee / enroll forms). */
  onOpen: (applicant: Applicant) => void;
  /** Reloads the list + funnel after a one-click stage move. */
  onRefresh: () => void;
}

/**
 * Per-stage quick actions shown directly in the admissions list (org admin
 * UI) — no need to open the modal for simple moves:
 * INQUIRY → Test Passed, TEST_SCHEDULED → Pass/Fail, TEST_PASSED → Submit
 * Form, FORM_SUBMITTED → Approve. Form-requiring steps (schedule test,
 * record fee, enroll) open the full modal via onOpen.
 */
export default function AdmissionsQuickActions({ applicant, onOpen, onRefresh }: AdmissionsQuickActionsProps) {
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  const quickMove = (status: AdmissionStatus) => run(async () => {
    await admissionService.updateStatus(applicant.id, status);
    toast.success(`Moved to ${status.replace(/_/g, ' ')}`);
    onRefresh();
  });

  const approve = () => run(async () => {
    await admissionService.approve(applicant.id);
    toast.success('Admission approved');
    onRefresh();
  });

  const buttons: { label: string; onClick: () => void }[] = [];
  switch (applicant.status) {
    case 'INQUIRY':
      buttons.push({ label: 'Schedule Test', onClick: () => onOpen(applicant) });
      buttons.push({ label: 'Test Passed', onClick: () => quickMove('TEST_PASSED') });
      break;
    case 'TEST_SCHEDULED':
      buttons.push({ label: 'Pass', onClick: () => quickMove('TEST_PASSED') });
      buttons.push({ label: 'Fail', onClick: () => quickMove('TEST_FAILED') });
      break;
    case 'TEST_PASSED':
      buttons.push({ label: 'Submit Form', onClick: () => quickMove('FORM_SUBMITTED') });
      break;
    case 'FORM_SUBMITTED':
      buttons.push({ label: 'Approve', onClick: approve });
      break;
    case 'APPROVED':
      buttons.push({ label: 'Record Fee', onClick: () => onOpen(applicant) });
      break;
    case 'FEE_PENDING':
      buttons.push({ label: 'Enroll', onClick: () => onOpen(applicant) });
      break;
    default:
      return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          disabled={busy}
          onClick={btn.onClick}
          className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2 py-1 text-[11px] font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-50 transition-colors"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}