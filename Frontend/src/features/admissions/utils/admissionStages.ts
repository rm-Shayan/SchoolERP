import type { AdmissionStatus } from '@/types';

export interface AdmissionStage {
  status: AdmissionStatus;
  label: string;
  dot: string;
  next: AdmissionStatus[];
}

// Pipeline flow (frontend-only — buttons). Statuses that need a dedicated form
// (TEST_SCHEDULED → schedule form, TEST_PASSED/TEST_FAILED → pass/fail buttons,
// FORM_SUBMITTED → approve action, APPROVED → fee form, FEE_PENDING → enroll form)
// are handled specially in AdmissionActions; `next` only carries statuses that
// use a plain one-click button. ENROLLED is NEVER a plain button — the backend
// rejects it via updateStatus (dedicated /enroll endpoint creates the student).
export const admissionStages: AdmissionStage[] = [
  { status: 'INQUIRY', label: 'Inquiry', dot: 'bg-gray-400', next: ['TEST_SCHEDULED'] },
  { status: 'TEST_SCHEDULED', label: 'Test Scheduled', dot: 'bg-blue-400', next: ['TEST_PASSED', 'TEST_FAILED'] },
  { status: 'TEST_PASSED', label: 'Test Passed', dot: 'bg-green-500', next: ['FORM_SUBMITTED'] },
  { status: 'FORM_SUBMITTED', label: 'Form Submitted', dot: 'bg-indigo-400', next: [] },
  { status: 'APPROVED', label: 'Approved', dot: 'bg-emerald-500', next: [] },
  { status: 'FEE_PENDING', label: 'Fee Pending', dot: 'bg-yellow-500', next: [] },
  { status: 'ENROLLED', label: 'Enrolled', dot: 'bg-green-600', next: [] },
];

export const rejectedStatuses: AdmissionStatus[] = ['TEST_FAILED', 'REJECTED'];

export function getStage(status: AdmissionStatus): AdmissionStage {
  return admissionStages.find((s) => s.status === status) ?? {
    status, label: status.replace(/_/g, ' '), dot: 'bg-gray-400', next: [],
  };
}
