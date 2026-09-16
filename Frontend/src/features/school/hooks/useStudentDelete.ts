'use client';

import { useState } from 'react';
import { studentService } from '@/lib/api';
import { documentsApi } from '@/lib/api/documents';
import type { Student } from '@/types';
import toast from 'react-hot-toast';

export function useStudentDelete(onDeleted: (id: string) => void) {
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await studentService.remove(deleteTarget.id);
      toast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} deleted`);
      onDeleted(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete student');
    } finally {
      setDeleteBusy(false);
    }
  };

  const downloadTc = async (student: Student) => {
    try {
      await documentsApi.downloadTc(student.id);
      toast.success('Transfer Certificate downloaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to download TC');
    }
  };

  return { deleteTarget, setDeleteTarget, deleteBusy, confirmDelete, downloadTc };
}