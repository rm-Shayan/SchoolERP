'use client';

import toast from 'react-hot-toast';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { getSocket } from '@/lib/socket';
import type { ProgressState } from './types';

type SetProgress = Dispatch<SetStateAction<ProgressState>>;

const EVENTS = ['import_progress', 'import_completed', 'import_failed'] as const;

/**
 * Job listeners are kept in a module-level registry keyed by jobId so cleanup
 * removes only *this* job's handlers. Calling `socket.off(event)` without a
 * handler reference detaches every listener of that event on the shared
 * singleton socket, which silently killed the other tab's progress feed.
 */
const handlers = new Map<string, Partial<Record<(typeof EVENTS)[number], (...args: any[]) => void>>>();
const stallTimers = new Map<string, number>();

export const cleanupJobListeners = (jobIdRef: RefObject<string | null>): void => {
  const socket = getSocket();
  const jobId = jobIdRef.current;
  if (!jobId) return;

  const stallTimer = stallTimers.get(jobId);
  if (stallTimer !== undefined) {
    window.clearTimeout(stallTimer);
    stallTimers.delete(jobId);
  }

  if (!socket) return;
  const registered = handlers.get(jobId);
  if (registered) {
    for (const event of EVENTS) {
      const handler = registered[event];
      if (handler) socket.off(event, handler);
    }
    handlers.delete(jobId);
  }
  socket.emit('leave_room', `job:${jobId}`);
};

export const listenForProgress = (
  jobId: string,
  setProgress: SetProgress,
  cleanup: () => void,
  jobIdRef: RefObject<string | null>,
  opts: { successMessage: string; failureMessage: string }
): void => {
  cleanup();
  jobIdRef.current = jobId;

  const attach = (): boolean => {
    const socket = getSocket();
    if (!socket?.connected) return false;
    socket.emit('join_room', `job:${jobId}`);

    const onProgress = (payload: any) => {
      if (payload?.jobId !== jobId) return;
      setProgress({
        phase: 'processing',
        current: payload.current,
        total: payload.total,
        percent: payload.progress,
      });
    };

    const onCompleted = (payload: any) => {
      if (payload?.jobId !== jobId) return;
      setProgress((prev) => ({ ...prev, phase: 'completed' }));
      toast.success(opts.successMessage);
      cleanup();
    };

    const onFailed = (payload: any) => {
      if (payload?.jobId !== jobId) return;
      setProgress((prev) => ({ ...prev, phase: 'failed', error: payload?.error }));
      toast.error(opts.failureMessage);
      cleanup();
    };

    handlers.set(jobId, {
      import_progress: onProgress,
      import_completed: onCompleted,
      import_failed: onFailed,
    });
    socket.on('import_progress', onProgress);
    socket.on('import_completed', onCompleted);
    socket.on('import_failed', onFailed);
    return true;
  };

  if (!attach()) getSocket()?.once('connect', attach);

  const stallTimer = window.setTimeout(() => {
    stallTimers.delete(jobId);
    setProgress((prev) => (prev.phase === 'processing' ? { ...prev, stalled: true } : prev));
  }, 90_000);
  stallTimers.set(jobId, stallTimer);
};