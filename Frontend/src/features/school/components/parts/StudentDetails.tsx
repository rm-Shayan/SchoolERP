'use client';

import { useState } from 'react';
import { Badge, Button, Card, CardHeader, CardContent, Modal } from '@/features/shared/components';
import { documentsApi } from '@/lib/api/documents';
import { studentService } from '@/lib/api/studentService';
import type { Student } from '@/types';
import toast from 'react-hot-toast';
import { StudentDetailsTable } from './StudentDetailsTable';
import YearlyAttendanceHistory from './YearlyAttendanceHistory';
import FeeYearlySummary from './FeeYearlySummary';
import StudentPhotoHeader from './StudentPhotoHeader';

const TC_REASON_LABELS: Record<string, string> = { TRANSFERRED_OUT: 'Transferred Out', DROPPED_OUT: 'Dropped Out', GRADUATED: 'Graduated' };

interface Props {
  student: Student | null;
  lastClassIds?: Set<string>;
  onClose: () => void;
  onUpdated?: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDeleted?: (id: string) => void;
}

export function StudentTcCard({ student }: { student: Student }) {
  const [tcBusy, setTcBusy] = useState(false);
  if (student.status === 'ACTIVE') return null;
  const label = TC_REASON_LABELS[student.status] ?? student.status.replace(/_/g, ' ');
  const isTransferredNoTc = student.status === 'TRANSFERRED_OUT' && !student.transferCertificate;

  const handleIssueTc = async () => {
    setTcBusy(true);
    try {
      await documentsApi.issueTc(student.id, { reason: 'TRANSFERRED_OUT' });
      toast.success('Transfer Certificate issued and downloaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to issue Transfer Certificate');
    } finally {
      setTcBusy(false);
    }
  };

  const handleDownloadTc = async () => {
    setTcBusy(true);
    try {
      await documentsApi.downloadTc(student.id);
      toast.success('Transfer Certificate downloaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to download Transfer Certificate');
    } finally {
      setTcBusy(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-amber-50/80 to-white">
      <CardHeader className="border-amber-100/70 pb-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Transfer Certificate</p>
          <Badge variant="warning">{label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Status</p><p className="font-medium text-gray-800">Issued</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Issued For</p><p className="font-medium text-gray-800">{label}</p></div>
        </div>
        {student.transferCertificate && (
          <div className="rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2 text-xs text-amber-700">
            <span className="font-semibold">{student.transferCertificate.tcNumber}</span> — TC issued on{' '}
            {new Date(student.transferCertificate.issuedAt).toLocaleDateString()}. It can be downloaded again anytime.
          </div>
        )}
        {isTransferredNoTc ? (
          <Button size="sm" variant="outline" loading={tcBusy} onClick={handleIssueTc}>Issue TC</Button>
        ) : (
          <Button size="sm" variant="outline" loading={tcBusy} onClick={handleDownloadTc} disabled={!student.transferCertificate}>
            Download TC
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function StudentDetails({ student, onClose, onUpdated, onEdit }: Props) {
  const [idBusy, setIdBusy] = useState(false);

  // "Re-issue" = fresh identifier (new QR) + new ID slip. Falls back to a
  // plain print for roles that can't re-issue (e.g. receptionist).
  const handleIdCard = async () => {
    if (!student) return;
    setIdBusy(true);
    try {
      await studentService.downloadIdCard(student.id);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        try {
          await documentsApi.studentIdCard(student.id);
        } catch (e2: any) {
          toast.error(e2?.message ?? 'Failed to print ID card');
        }
        return;
      }
      toast.error(err?.message ?? err?.response?.data?.message ?? 'Failed to re-issue ID card');
    } finally {
      setIdBusy(false);
    }
  };

  return (
    <Modal open={!!student} onClose={onClose} title="Student Details">
      {student && (
        <div className="space-y-5">
          <StudentPhotoHeader student={student} onUpdated={onUpdated} />
          <StudentDetailsTable student={student} />
          {student.status !== 'ACTIVE' && <StudentTcCard student={student} />}
          <YearlyAttendanceHistory studentId={student.id} />
          <FeeYearlySummary studentId={student.id} />
          <div className="space-y-3 border-t border-gray-100 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" loading={idBusy} onClick={handleIdCard}>Print / Re-issue ID Card</Button>
                {onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(student)}>Edit Details</Button>}
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
