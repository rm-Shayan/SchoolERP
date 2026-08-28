'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface UseQrScannerOpts {
  onScan: (code: string) => void;
  cooldownMs?: number;
}

export function useQrScanner({ onScan, cooldownMs = 3000 }: UseQrScannerOpts) {
  const containerIdRef = useRef('qr-cam-' + Math.random().toString(36).slice(2, 8));
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRef = useRef('');
  const cooldownRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stop = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setIsStarted(false);
  }, []);

  const start = useCallback(async () => {
    setStarting(true); setError(null);
    await stop();

    try {
      let camConfig: string | { facingMode: string } = { facingMode: 'environment' };
      try {
        const devs = await Html5Qrcode.getCameras();
        if (devs?.length) {
          const rear = devs.find((d) => /back|rear|environment/i.test(d.label));
          const front = devs.find((d) => /front|user|face/i.test(d.label));
          camConfig = rear?.id ?? front?.id ?? devs[0].id;
        }
      } catch { /* no prior permission — use facingMode */ }

      const qr = new Html5Qrcode(containerIdRef.current);
      scannerRef.current = qr;
      await qr.start(camConfig, { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        (text) => {
          if (text === lastRef.current) return;
          lastRef.current = text;
          onScanRef.current(text);
          if (cooldownRef.current) clearTimeout(cooldownRef.current);
          cooldownRef.current = setTimeout(() => { lastRef.current = ''; }, cooldownMs);
        },
        () => {}
      );
      setIsStarted(true);
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? '');
      if (/permission|notallowed/i.test(msg)) setError('Camera permission denied. Allow camera access and retry.');
      else if (/notfound|nocameras/i.test(msg)) setError('No camera found. Connect a camera and retry.');
      else if (/shaderight|secure/i.test(msg)) setError('Camera requires HTTPS or localhost.');
      else setError(msg.slice(0, 200) || 'Could not start camera. Click Retry.');
    } finally { setStarting(false); }
  }, [stop, cooldownMs]);

  useEffect(() => () => { stop(); if (cooldownRef.current) clearTimeout(cooldownRef.current); }, [stop]);

  return { containerId: containerIdRef.current, isStarted, starting, error, start, stop };
}
