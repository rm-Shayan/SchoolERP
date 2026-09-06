'use client';

import { ConfirmDialog } from '@/features/shared/components';
import type { School } from '@/types';

interface DeleteBranchDialogProps {
  school: School | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteBranchDialog({ school, loading, onConfirm, onCancel }: DeleteBranchDialogProps) {
  return (
    <ConfirmDialog
      open={school !== null}
      title="Delete branch"
      message={
        school ? (
          <>
            This permanently removes <span className="font-medium">{school.name}</span> and all its
            data (students, fees, attendance, etc.). This action cannot be undone.
          </>
        ) : (
          ''
        )
      }
      confirmLabel="Delete"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}