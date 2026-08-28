'use client';

import { useState } from 'react';
import { admissionService } from '@/lib/api';
import type { Applicant, AdmissionStatus } from '@/types';
import { Modal, Badge } from '@/features/shared/components';
import { getStage } from '../utils/admissionStages';
import { ApplicantDetails } from './parts/ApplicantDetails';
import { ApplicantDocuments } from './parts/ApplicantDocuments';
import AdmissionActions from './parts/AdmissionActions';
import AdmissionModalFooter from './parts/AdmissionModalFooter';
import toast from 'react-hot-toast';

interface AdmissionActionsModalProps {
  applicant: Applicant;
  onClose: () => void;
  onChanged: (applicant: Applicant) => void;
  onRefresh: () => void;
  onEdit: (applicant: Applicant) => void;
  onRemoved: (id: string) => void;
}

export default function AdmissionActionsModal({ applicant, onClose, onChanged, onRefresh, onEdit, onRemoved }: AdmissionActionsModalProps) {
  const stage = getStage(applicant.status);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const enrolled = applicant.status === 'ENROLLED';
  const move = async (status: AdmissionStatus, extra?: { testDate?: string; testTime?: string; testVenue?: string; testMarks?: string }) => {
    setBusy(true);
    try {
      const updated = await admissionService.updateStatus(applicant.id, status, extra);
      toast.success(`Moved to ${status.replace(/_/g, ' ')}`);
      onChanged(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    setBusy(true);
    try {
      const updated = await admissionService.approve(applicant.id);
      toast.success('Applicant approved — slip emailed to parent');
      onChanged(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to approve');
    } finally {
      setBusy(false);
    }
  };

  const generateSlip = async (amount: string) => {
    setBusy(true);
    try {
      await admissionService.recordAdvanceFee(applicant.id, Number(amount));
      await admissionService.getSlipPdf(applicant.id);
      toast.success('Advance fee recorded — slip opened');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to record advance fee');
    } finally {
      setBusy(false);
    }
  };

  const enroll = async (sectionId: string, rollNumber: string) => {
    setBusy(true);
    try {
      await admissionService.enroll(applicant.id, { sectionId, rollNumber: rollNumber || undefined });
      toast.success('Student enrolled — ID card generated');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to enroll');
    } finally {
      setBusy(false);
    }
  };

  const handlePhoto = async (file: File) => {
    // After enrollment, photo must be updated from the Students section
    if (enrolled) return;
    setBusy(true);
    try {
      const updated = await admissionService.uploadPhoto(applicant.id, file);
      toast.success('Photo uploaded');
      onChanged(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to upload photo');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await admissionService.remove(applicant.id);
      toast.success('Applicant deleted');
      setConfirmDelete(false);
      onRemoved(applicant.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete applicant');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`${applicant.firstName} ${applicant.lastName}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={enrolled ? 'success' : 'info'}>{stage.label}</Badge>
        </div>

        {enrolled ? (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
            <strong>Student enrolled.</strong> Go to the <em>Students</em> section for the photo and ID card.
          </div>
        ) : (
          <ApplicantDetails applicant={applicant} busy={busy} onPhoto={handlePhoto} />
        )}

        <ApplicantDocuments applicant={applicant} onChanged={onChanged} />

        <AdmissionActions
          applicant={applicant}
          busy={busy}
          onMove={move}
          onApprove={approve}
          onGenerateSlip={generateSlip}
          onEnroll={enroll}
        />
      </div>

      <AdmissionModalFooter
        applicant={applicant}
        onEdit={onEdit}
        onReject={() => move('REJECTED')}
        onDeleteRequest={() => setConfirmDelete(true)}
        onDeleteConfirm={handleDelete}
        onDeleteCancel={() => setConfirmDelete(false)}
        confirmDelete={confirmDelete}
      />
    </Modal>
  );
}
