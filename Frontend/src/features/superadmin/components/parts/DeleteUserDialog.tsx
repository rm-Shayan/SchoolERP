'use client';

import { useState } from 'react';
import { Modal, Input, Button } from '@/features/shared/components';
import { staffService } from '@/lib/api';
import toast from 'react-hot-toast';
import type { User } from '@/types';

interface DeleteUserDialogProps {
  user: User | null;
  onClose: () => void;
  onDeleted: (userId: string) => void;
}

export default function DeleteUserDialog({ user, onClose, onDeleted }: DeleteUserDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await staffService.deactivate(user.id, reason.trim() || undefined);
      toast.success(`${user.name} has been deactivated`);
      onDeleted(user.id);
      setReason('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to deactivate user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal open={!!user} onClose={handleClose} title="Deactivate User" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Deactivating <strong>{user.name}</strong> ({user.email}) will immediately lock them out of the portal.
          They will not be able to log in until reactivated.
        </p>
        <Input
          label="Reason (optional)"
          placeholder="e.g. Left the organization"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 pt-1">
          <Button
            variant="danger"
            loading={loading}
            disabled={loading}
            onClick={handleDelete}
          >
            Deactivate
          </Button>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
