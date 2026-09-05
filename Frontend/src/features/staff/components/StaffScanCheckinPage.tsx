'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { staffAttendanceService } from '@/lib/api';
import { PageHeader, Button, Card, CardContent, Input } from '@/features/shared/components';
import { useQrScanner } from './parts/useQrScanner';

interface ScanResult {
  id: string;
  name: string;
  time: string;
  kind: 'ok' | 'duplicate' | 'error';
  message: string;
}

const kindStyles: Record<ScanResult['kind'], string> = {
  ok: 'bg-green-50 text-green-700 border-green-200',
  duplicate: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
};

interface StaffScanCheckinProps {
  embedded?: boolean;
  staffId?: string;
}

export default function StaffScanCheckinPage({ embedded }: StaffScanCheckinProps) {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);

  const checkIn = useCallback(async (token: string) => {
    setBusy(true);
    try {
      const res: any = await staffAttendanceService.scanCheckIn(token);
      const d = res?.data?.data ?? res?.data ?? res;
      setResults((prev) => [
        {
          id: `${token}-${Date.now()}`,
          name: d?.staffName ?? 'Staff',
          time: new Date().toLocaleTimeString(),
          kind: d?.alreadyCheckedIn ? 'duplicate' : 'ok',
          message: d?.alreadyCheckedIn
            ? 'Already checked in today'
            : 'Checked in successfully',
        },
        ...prev.slice(0, 19),
      ]);
    } catch (err: any) {
      toast.error(err?.message ?? 'Check-in failed');
      setResults((prev) => [
        {
          id: `${token}-${Date.now()}`,
          name: 'Unknown card',
          time: new Date().toLocaleTimeString(),
          kind: 'error',
          message: err?.message ?? 'Invalid QR code',
        },
        ...prev.slice(0, 19),
      ]);
    } finally {
      setBusy(false);
    }
  }, []);

  useQrScanner(true, checkIn);

  return (
    <div className={embedded ? '' : 'space-y-6'}>
      {!embedded && (
        <PageHeader
          title="Staff Scan Check-in"
          description="Gate/table par staff ID card ka QR scan karke attendance mark karein."
        />
      )}

      <div className={embedded ? '' : 'grid gap-6 lg:grid-cols-2'}>
        <Card>
          <CardContent className="space-y-4">
            <div
              id="qr-reader-region"
              className="w-full min-h-[280px] rounded-xl overflow-hidden bg-black/90"
            />
            {busy && <p className="text-xs text-gray-500">Processing…</p>}

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (manual.trim() && !busy) {
                  checkIn(manual.trim());
                  setManual('');
                }
              }}
            >
              <Input
                value={manual}
                onChange={(e: any) => setManual(e.target.value)}
                placeholder="Camera na ho to QR token paste karein"
              />
              <Button type="submit" disabled={busy || !manual.trim()}>
                Check in
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Recent Scans</h3>
            {results.length === 0 ? (
              <p className="text-sm text-gray-400">Abhi koi scan nahi hui.</p>
            ) : (
              <ul className="space-y-2">
                {results.map((r) => (
                  <li
                    key={r.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${kindStyles[r.kind]}`}
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs">
                      {r.message} · {r.time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
