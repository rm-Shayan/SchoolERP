'use client';

import { useState } from 'react';
import { Button, ConfirmDialog } from '@/features/shared/components';
import { studentService } from '@/lib/api';
import type { Student } from '@/types';
import toast from 'react-hot-toast';

interface StudentDeleteZoneProps {
  student: Student;
  onDeleted: (id: string) => void;
}

export function StudentDeleteZone({ student, onDeleted }: StudentDeleteZoneProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await studentService.remove(student.id);
      toast.success('Student permanently deleted');
      onDeleted(student.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete student');
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-700">Delete student permanently</p>
          <p className="text-xs text-red-500 mt-0.5">
            Removes {student.firstName} {student.lastName} and all attendance, fee, exam &amp; conduct history.
          </p>
        </div>
        <Button size="sm" variant="danger" onClick={() => setOpen(true)}>
          Delete Student
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        title="Delete student permanently?"
        message={
          <>
            This permanently deletes <span className="font-medium">{student.firstName} {student.lastName}</span>{' '}
            (roll #{student.rollNumber}) along with all attendance records, fees, exam results and conduct remarks.
            This action <span className="font-semibold">cannot be undone</span>.
          </>
        }
        confirmLabel="Delete Forever"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
