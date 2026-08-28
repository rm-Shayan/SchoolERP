'use client';

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';
import type { ProgressState } from './types';

export function useImportProgress() {
  const jobIdRef = useRef<string | null>(null);

  const cleanupJobListeners = useCallback(() => {
    const socket = getSocket();
    if (!socket || !jobIdRef.current) return;
    const room = `job:${jobIdRef.current}`;
    socket.off('import_progress');
    socket.off('import_completed');
    socket.off('import_failed');
    socket.emit('leave_room', room);
  }, []);

  useEffect(() => cleanupJobListeners, [cleanupJobListeners]);

  const listenForProgress = useCallback(
    (jobId: string, setProgress: Dispatch<SetStateAction<ProgressState>>) => {
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
          toast.success('Import completed!');
          cleanupJobListeners();
        });

        socket.on('import_failed', (payload: any) => {
          if (payload?.jobId !== jobId) return;
          setProgress((prev) => ({ ...prev, phase: 'failed', error: payload?.error }));
          toast.error('Import failed');
          cleanupJobListeners();
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
    },
    [cleanupJobListeners]
  );

  const resetJob = useCallback(() => {
    cleanupJobListeners();
    jobIdRef.current = null;
  }, [cleanupJobListeners]);

  return { listenForProgress, cleanupJobListeners, resetJob };
}
