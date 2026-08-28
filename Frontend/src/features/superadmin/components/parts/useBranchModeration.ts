'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { moderationService, schoolService } from '@/lib/api';
import { dedupRequest } from '@/lib/utils/requestDedup';
import type { Organization, School } from '@/types';
import toast from 'react-hot-toast';

const errMsg = (err: any, fallback: string) => err?.response?.data?.message || err?.message || fallback;

export function useBranchModeration(
  school: School | null,
  org: Organization | null,
  reloadAll: () => Promise<void>
) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteBranch = useCallback(async () => {
    if (!school || !org) return;
    setDeleting(true);
    try {
      await dedupRequest(`delete-school-${school.id}`, async () => {
        await schoolService.remove(school.id);
      });
      toast.success('Branch deleted');
      router.push(`/admin/organizations/${org.id}`);
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to delete branch'));
    } finally {
      setDeleting(false);
    }
  }, [school, org, router]);

  const confirmBlock = useCallback(
    async (reason: string) => {
      if (!school) return;
      setBlocking(true);
      try {
        await moderationService.blockSchool(school.id, reason);
        toast.success('Branch blocked');
        setBlockOpen(false);
        await reloadAll();
      } catch (err: any) {
        toast.error(errMsg(err, 'Failed to block branch'));
      } finally {
        setBlocking(false);
      }
    },
    [school, reloadAll]
  );

  const confirmUnblock = useCallback(async () => {
    if (!school) return;
    setBlocking(true);
    try {
      await moderationService.unblockSchool(school.id);
      toast.success('Branch unblocked');
      await reloadAll();
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to unblock branch'));
    } finally {
      setBlocking(false);
    }
  }, [school, reloadAll]);

  return {
    deleting,
    blocking,
    blockOpen,
    setBlockOpen,
    confirmDelete,
    setConfirmDelete,
    handleDeleteBranch,
    confirmBlock,
    confirmUnblock,
  };
}
