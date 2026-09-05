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
  const [busy, setBusy] = useState(false);

  const patchLocal = useCallback(
    (member: DirectoryItem, patch: Partial<DirectoryItem>) => {
      setData((prev) => prev ? {
        ...prev,
        items: prev.items.map((u) => (u.id === member.id && u.type === member.type ? { ...u, ...patch } : u)),
      } : prev);
    },
    [setData]
  );

  const confirmBlock = useCallback(
    async (reason: string) => {
      if (!blockTarget || blockTarget.type !== 'staff') return;
      setBusy(true);
      try {
        await moderationService.blockUser(blockTarget.id, reason);
        patchLocal(blockTarget, { status: 'BLOCKED' });
        toast.success(`${blockTarget.name} blocked`);
        setBlockTarget(null);
      } catch (err: any) {
        toast.error(errMsg(err, 'Failed to block user'));
        reload();
      } finally {
        setBusy(false);
      }
    },
    [blockTarget, patchLocal, reload]
  );

  const confirmUnblock = useCallback(
    async (member: DirectoryItem) => {
      if (member.type !== 'staff') return;
      setBusy(true);
      try {
        await moderationService.unblockUser(member.id);
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

  return { blockTarget, setBlockTarget, busy, confirmBlock, confirmUnblock };
}
