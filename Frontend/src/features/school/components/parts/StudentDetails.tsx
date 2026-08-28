'use client';

import { useRef, useState } from 'react';
import { Badge, Button, Modal } from '@/features/shared/components';
import { documentsApi } from '@/lib/api/documents';
import type { Student } from '@/types';
import { studentService } from '@/lib/api';
import toast from 'react-hot-toast';
import { StudentActions } from './StudentActions';
import { StudentDetailsTable } from './StudentDetailsTable';
import YearlyAttendanceHistory from './YearlyAttendanceHistory';
import FeeYearlySummary from './FeeYearlySummary';

interface StudentDetailsProps {
  student: Student | null;
  lastClassIds?: Set<string>;
  onClose: () => void;
  onUpdated?: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDeleted?: (id: string) => void;
}

const MAX_PHOTO_MB = 5;
// HEIC/HEIF (iPhone) bhi — backend sharp se JPEG me convert karta hai.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function StudentDetails({ student, lastClassIds, onClose, onUpdated, onEdit, onDeleted }: StudentDetailsProps) {
  const photoRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [idBusy, setIdBusy] = useState(false);

  const handlePhoto = async (file: File) => {
    if (!student) return;
    // Client-side pehle — bina request ke clear feedback (HEIC/oversized photos
    // backend reject karta tha; ab 5MB tak + JPG/PNG/WebP allow hain).
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, WebP or HEIC (iPhone) photos are allowed');
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error(`Photo must be ${MAX_PHOTO_MB}MB or smaller`);
      return;
    }
    setBusy(true);
    try {
      const updated = await studentService.uploadPhoto(student.id, file);
      toast.success('Photo updated successfully');
      onUpdated?.(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to upload photo');
    } finally {
      setBusy(false);
    }
  };

  const handleIdCard = async () => {
    if (!student) return;
    setIdBusy(true);
    try {
      await documentsApi.studentIdCard(student.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to generate ID card');
    } finally {
      setIdBusy(false);
    }
  };

  return (
    <Modal open={!!student} onClose={onClose} title="Student Details">
      {student && (
        <div className="space-y-5">
          {/* Header — photo + identity */}
          <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gradient-to-r from-primary-50/70 to-white p-4">
            {student.imageUrl ? (
              <img
                src={student.imageUrl}
                alt={`${student.firstName} ${student.lastName}`}
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white shadow-sm shrink-0"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-2xl font-bold text-white shrink-0">
                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold leading-tight text-gray-900">
                {student.firstName} {student.lastName}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {student.section?.class?.name ? `${student.section.class.name} — ${student.section.name} · ` : ''}Roll #{student.rollNumber}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={student.status === 'ACTIVE' ? 'success' : 'info'}>
                  {student.status.replace('_', ' ')}
                </Badge>
                {student.isBlocked && <Badge variant="danger">Blocked</Badge>}
              </div>
            </div>
            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ''; }} />
            <Button
              size="sm"
              variant="outline"
              loading={busy}
              className="self-end shrink-0"
              onClick={() => photoRef.current?.click()}
            >
              {student.imageUrl ? 'Change Photo' : 'Upload Photo'}
            </Button>
          </div>

          {/* Info table — labels left, values right */}
          <StudentDetailsTable student={student} />

          {/* Archived yearly attendance — 365-din purani attendance ka rollup */}
          <YearlyAttendanceHistory studentId={student.id} />

          {/* Yearly fee summary — per-year charged / paid / outstanding */}
          <FeeYearlySummary studentId={student.id} />

          {/* Actions */}
          <div className="space-y-3 border-t border-gray-100 pt-3">
            <StudentActions student={student} lastClassIds={lastClassIds} onUpdated={(u) => onUpdated?.(u)} onDeleted={(id) => onDeleted?.(id)} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" loading={idBusy} onClick={handleIdCard}>
                  🪪 Print / Re-issue ID Card
                </Button>
                {onEdit && (
                  <Button size="sm" variant="outline" onClick={() => onEdit(student)}>
                    ✏️ Edit Details
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
