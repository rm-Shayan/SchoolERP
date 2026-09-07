'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { syncPortalStatus, resetPortalStatus } from '@/store/slices/portalStatusSlice';

export function useSocket() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const schoolId = user?.schoolId;
  const organizationId = user?.organizationId;

  useEffect(() => {
    if (!isAuthenticated) return;
    // Seed the status pill from the login payload (DTO now carries status).
    dispatch(
      syncPortalStatus({
        orgStatus: user?.organization?.status,
        schoolStatus: user?.school?.status,
      })
    );
    connectSocket(schoolId, organizationId);
    return () => {
      disconnectSocket();
      dispatch(resetPortalStatus());
    };
  }, [isAuthenticated, schoolId, organizationId, dispatch]);
}
