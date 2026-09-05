'use client';

import { useState } from 'react';
import { admissionService } from '@/lib/api';
import type { Applicant } from '@/types';
import { Button } from '@/features/shared/components';
import { documentsApi } from '@/lib/api/documents';
import toast from 'react-hot-toast';

interface AdmissionSlipActionsProps {
  applicant: Applicant;
}

export default function AdmissionSlipActions({ applicant }: AdmissionSlipActionsProps) {
  const [sending, setSending] = useState(false);

  const sendToParent = async () => {
    setSending(true);
    try {
      const res = await admissionService.sendSlipToParent(applicant.id);
      if (res.delivered) {
        toast.success('Slip sent to parent');
      } else {
        toast.error(res.reason ?? 'Could not send slip — no parent email configured');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to send slip');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Admission Slip</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button size="sm" variant="outline" disabled={sending} onClick={() => documentsApi.admissionSlip(applicant.id)}>
          Download Slip
        </Button>
        <Button size="sm" loading={sending} onClick={sendToParent}>
          Send to Parent
        </Button>
      </div>
    </div>
  );
}