'use client';

import { useCallback } from 'react';
import { moderationService } from '@/lib/api';
import toast from 'react-hot-toast';

const errMsg = (err: any, fallback: string) => err?.response?.data?.message || err?.message || fallback;

interface UseOrganizationModerationArgs {
  id?: string;
  reload: () => Promise<void>;
}

export function useOrganizationModeration({ id, reload }: UseOrganizationModerationArgs) {
  const handleBlockOrg = useCallback(
    async (reason?: string) => {
      if (!id) return false;
      try {
        await moderationService.blockOrganization(id, reason);
        toast.success(`${id} organization blocked — all branches and users locked out`);
        await reload();
        return true;
      } catch (err: any) {
        toast.error(errMsg(err, 'Failed to block organization'));
        return false;
      }
    },
    [id, reload]
  );

  const handleUnblockOrg = useCallback(async () => {
    if (!id) return false;
    try {
      await moderationService.unblockOrganization(id);
      toast.success('Organization unblocked — access restored');
      await reload();
      return true;
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to unblock organization'));
      return false;
    }
  }, [id, reload]);

  const handleBlockSchool = useCallback(
    async (schoolId: string, reason?: string) => {
      try {
        await moderationService.blockSchool(schoolId, reason);
        await reload();
        toast.success('Branch blocked — users locked out');
        return true;
      } catch (err: any) {
        toast.error(errMsg(err, 'Failed to block branch'));
        return false;
      }
    },
    [reload]
  );

  const handleUnblockSchool = useCallback(
    async (schoolId: string) => {
      try {
        await moderationService.unblockSchool(schoolId);
        await reload();
        toast.success('Branch unblocked — access restored');
        return true;
      } catch (err: any) {
        toast.error(errMsg(err, 'Failed to unblock branch'));
        return false;
      }
    },
    [reload]
  )

  return { handleBlockOrg, handleUnblockOrg, handleBlockSchool, handleUnblockSchool };
}
