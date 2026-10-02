'use client';

import { useEffect, useState } from 'react';

/**
 * Staged image selection — file select par upload fire NAHI hota.
 *
 * File sirf local preview ke saath stage hoti hai; actual upload call form ke
 * Save/Update button se hota hai (`pendingFile` check karke). Isse:
 *  - user cancel kare to koi orphan file storage par nahi jati
 *  - network call user ke explicit confirm par hoti hai
 *
 * Object URLs hamesha revoke hote hain (state change + unmount dono par).
 */
export function useStagedImage() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stage = (file: File | null) => {
    setPendingFile(file);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  return {
    pendingFile,
    previewUrl,
    hasPending: !!pendingFile,
    stage,
    clear: () => stage(null),
  };
}