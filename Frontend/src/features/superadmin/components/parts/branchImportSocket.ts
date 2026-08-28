'use client';

﻿import type { Dispatch, RefObject, SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';

export interface ProgressState {
  phase: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  current?: number;
  total?: number;
  percent?: number;
  error?: string;
  stalled?: boolean;
}

type SetProgress = Dispatch<SetStateAction<ProgressState>>;

export const cleanupJobListeners = (
  jobIdRef: RefObject<string | null>
): void => {
  const socket = getSocket();
  if (!socket || !jobIdRef.current) return;
  const room = `job:${jobIdRef.current}`;
  socket.off('import_progress');
  socket.off('import_completed');
  socket.off('import_failed');
  socket.emit('leave_room', room);
};

export const listenForProgress = (
  jobId: string,
  setProgress: SetProgress,
  cleanup: () => void,
  jobIdRef: RefObject<string | null>
): void => {
  jobIdRef.current = jobId;
  const attach = () => {
    const socket = getSocket();
    if (!socket?.connected) return false;
    socket.emit('join_room', `job:${jobId}`);

    socket.on('import_progress', (payload: any) => {
      if (payload?.jobId !== jobId) return;
      setProgress({
        phase: 'processing',
        current: payload.current,
        total: payload.total,
        percent: payload.progress,
      });
    });

    socket.on('import_completed', (payload: any) => {
      if (payload?.jobId !== jobId) return;
      setProgress((prev) => ({ ...prev, phase: 'completed' }));
      toast.success('Branch import completed!');
      cleanup();
    });

    socket.on('import_failed', (payload: any) => {
      if (payload?.jobId !== jobId) return;
      setProgress((prev) => ({ ...prev, phase: 'failed', error: payload?.error }));
      toast.error('Branch import failed');
      cleanup();
    });
    return true;
  };

  if (!attach()) {
    const socket = getSocket();
    socket?.once('connect', attach);
  }

  window.setTimeout(() => {
    setProgress((prev) => {
      if (prev.phase !== 'processing') return prev;
      return { ...prev, stalled: true };
    });
  }, 90_000);
};
