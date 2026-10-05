'use client';

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { cleanupJobListeners, listenForProgress } from './importProgressSocket';
import type { ProgressState } from './types';

export function useImportProgress() {
  const jobIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => cleanupJobListeners(jobIdRef), []);

  useEffect(() => cleanup, [cleanup]);

  const listenForJob = useCallback(
    (
      jobId: string,
      setProgress: Dispatch<SetStateAction<ProgressState>>,
      messages: { successMessage: string; failureMessage: string }
    ) => listenForProgress(jobId, setProgress, cleanup, jobIdRef, messages),
    [cleanup]
  );

  const resetJob = useCallback(() => {
    cleanup();
    jobIdRef.current = null;
  }, [cleanup]);

  return { listenForJob, cleanup, resetJob };
}