'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Button, ConfirmDialog, Input, Modal } from '@/features/shared/components';
import { moderationService, studentService } from '@/lib/api';
import type { Student, StudentStatus } from '@/types';
import toast from 'react-hot-toast';
import { StudentDeleteZone } from './StudentDeleteZone';
import { isLastClassStudent } from './helpers';

interface StudentActionsProps {
  student: Student;
  lastClassIds?: Set<string>;
  onUpdated: (student: Student) => void;
  onDeleted: (id: string) => void;
}

// "Passed Out" (graduate) only for the school's last class — other classes are promoted.
const LIFECYCLE: { status: StudentStatus; label: string; hint: string }[] = [
  { status: 'GRADUATED', label: 'Passed Out', hint: 'Student has completed the school\'s final class — record stays archived and can be reactivated anytime.' },
  { status: 'DROPPED_OUT', label: 'Drop Out', hint: 'Student left school — record stays archived and can be reactivated anytime.' },
  { status: 'TRANSFERRED_OUT', label: 'Transfer Out', hint: 'Student moved to another school — record stays archived and can be reactivated anytime.' },
];

export function StudentActions({ student, lastClassIds, onUpdated, onDeleted }: StudentActionsProps) {
  const canPassOut = isLastClassStudent(student, lastClassIds ?? new Set());
  const lifecycle = LIFECYCLE.filter((l) => l.status !== 'GRADUATED' || canPassOut);
  // Permanent delete = platform correction power — only SUPER_ADMIN (branch admins archive, not wipe).
  const { user } = useAppSelector((s) => s.auth);
  const canDelete = user?.role === 'SUPER_ADMIN';
  const [busy, setBusy] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [statusTarget, setStatusTarget] = useState<StudentStatus | null>(null);

  const apply = async (action: () => Promise<Student>, message: string, close?: () => void) => {
    setBusy(true);
    try {
      const updated = await action();
      toast.success(message);
      onUpdated(updated);
      close?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Action failed — try again');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (status: StudentStatus) =>
    apply(() => studentService.updateStatus(student.id, status), `Student marked as ${status.replace(/_/g, ' ').toLowerCase()}`);

  const block = () =>
    apply(() => moderationService.blockStudent(student.id, reason.trim() || undefined), 'Student blocked', () => { setBlockOpen(false); setReason(''); });

  const unblock = () => apply(() => moderationService.unblockStudent(student.id), 'Student unblocked');

  const isActive = student.status === 'ACTIVE';
  const activeTarget = LIFECYCLE.find((l) => l.status === statusTarget);

  return (
    <div className="space-y-3">
      {student.isBlocked && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <p className="font-medium">{student.blockedReason ? `Blocked — ${student.blockedReason}` : 'Blocked'}</p>
          {student.blockedByName && <p className="text-xs text-red-500 mt-0.5">By {student.blockedByName}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isActive ? (
          lifecycle.map((l) => (
            <Button key={l.status} size="sm" variant="outline" disabled={busy} onClick={() => setStatusTarget(l.status)}>
              {l.label}
            </Button>
          ))
        ) : (
          <Button size="sm" variant="outline" loading={busy} onClick={() => changeStatus('ACTIVE')}>
            Reactivate
          </Button>
        )}
        {student.isBlocked ? (
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            onClick={unblock}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Unblock Student
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            onClick={() => setBlockOpen(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Block Student
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={!!statusTarget}
        title={activeTarget?.label ?? 'Change status'}
        message={activeTarget?.hint ?? ''}
        confirmLabel="Confirm"
        loading={busy}
        onConfirm={() => {
          if (statusTarget) changeStatus(statusTarget);
          setStatusTarget(null);
        }}
        onCancel={() => setStatusTarget(null)}
      />

      <Modal open={blockOpen} onClose={() => setBlockOpen(false)} title="Block Student" size="sm">
        <p className="text-sm text-gray-600 leading-relaxed">
          Blocking <span className="font-medium">{student.firstName} {student.lastName}</span> revokes their
          portal access (gate scan + parent login). You can unblock anytime.
        </p>
        <div className="mt-4">
          <Input
            label="Reason (optional)"
            placeholder="e.g. Repeated misconduct"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-5">
          <Button variant="ghost" onClick={() => setBlockOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" loading={busy} onClick={block}>
            Block Student
          </Button>
        </div>
      </Modal>

      {canDelete && <StudentDeleteZone student={student} onDeleted={onDeleted} />}
    </div>
  );
}
