'use client';

import { useCallback, useState } from 'react';
import { moderationService } from '@/lib/api';
import type { PlatformDirectory, DirectoryItem } from '@/lib/api/staffService';
import toast from 'react-hot-toast';

const errMsg = (err: any, fallback: string) => err?.response?.data?.message || err?.message || fallback;

interface UseUserBlockingArgs {
  setData: (fn: (prev: PlatformDirectory | null) => PlatformDirectory | null) => void;
  reload: () => Promise<void>;
}

export function useUserBlocking({ setData, reload }: UseUserBlockingArgs) {
  const [blockTarget, setBlockTarget] = useState<DirectoryItem | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [busy, setBusy] = useState(false);

  const patchLocal = useCallback(
    (member: DirectoryItem, patch: Partial<DirectoryItem>) => {
      setData((prev) => (prev ? { ...prev, items: prev.items.map((u) => (u.id === member.id && u.type === member.type ? { ...u, ...patch } : u)) } : prev));
    },
    [setData]
  );

  const confirmBlock = useCallback(async () => {
    if (!blockTarget) return;
    setBusy(true);
    const reason = blockReason.trim() || undefined;
    try {
      if (blockTarget.type === 'staff') {
        await moderationService.blockUser(blockTarget.id, reason);
      } else if (blockTarget.type === 'student') {
        await moderationService.blockStudent(blockTarget.id, reason);
      } else if (blockTarget.type === 'parent') {
        await moderationService.blockParent(blockTarget.id, reason);
      }
      patchLocal(blockTarget, { status: 'BLOCKED' });
      toast.success(`${blockTarget.name} blocked`);
      reset();
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to block user'));
      reload();
    } finally {
      setBusy(false);
    }
  }, [blockTarget, blockReason, patchLocal, reload]);

  const confirmUnblock = useCallback(
    async (member: DirectoryItem) => {
      setBusy(true);
      try {
        if (member.type === 'staff') {
          await moderationService.unblockUser(member.id);
        } else if (member.type === 'student') {
          await moderationService.unblockStudent(member.id);
        } else if (member.type === 'parent') {
          await moderationService.unblockParent(member.id);
        }
        patchLocal(member, { status: 'ACTIVE' });
        toast.success(`${member.name} unblocked`);
      } catch (err: any) {
        toast.error(errMsg(err, 'Failed to unblock user'));
        reload();
      } finally {
        setBusy(false);
      }
    },
    [patchLocal, reload]
  );

  const reset = useCallback(() => {
    setBlockTarget(null);
    setBlockReason('');
  }, []);

  return { blockTarget, setBlockTarget, blockReason, setBlockReason, busy, confirmBlock, confirmUnblock, reset };
}
