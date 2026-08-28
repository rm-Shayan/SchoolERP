'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const ELEMENT_ID = 'qr-reader-region';
const DUPLICATE_WINDOW_MS = 3000;

/**
 * html5-qrcode camera scanner hook.
 * Mounts into #qr-reader-region when `active`; same-token rescans within
 * DUPLICATE_WINDOW_MS are ignored so one card = one beep.
 */
export function useQrScanner(active: boolean, onScan: (token: string) => void) {
  const callbackRef = useRef(onScan);
  const lastRef = useRef<{ token: string; at: number }>({ token: '', at: 0 });
  callbackRef.current = onScan;

  useEffect(() => {
    if (!active || !document.getElementById(ELEMENT_ID)) return;

    const scanner = new Html5Qrcode(ELEMENT_ID);
    let stopped = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          const now = Date.now();
          if (
            decoded === lastRef.current.token &&
            now - lastRef.current.at < DUPLICATE_WINDOW_MS
          ) {
            return;
          }
          lastRef.current = { token: decoded, at: now };
          callbackRef.current(decoded);
        },
        () => {
          /* per-frame no-match noise — intentionally ignored */
        }
      )
      .catch(() => {
        /* camera permission denied / unavailable — UI shows retry hint */
      });

    return () => {
      if (stopped) return;
      stopped = true;
      try {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      } catch { /* scanner may not have started */ }
    };
  }, [active]);
}
