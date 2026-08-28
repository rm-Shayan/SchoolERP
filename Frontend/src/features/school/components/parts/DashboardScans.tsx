'use client';

import { Badge, Card, CardHeader, CardContent } from '@/features/shared/components';
import type { LiveScanEvent } from '@/store/slices/socketSlice';

export function LiveScansCard({ scans }: { scans: LiveScanEvent[] }) {
  return (
    <Card className="lg:col-span-6 flex flex-col min-h-[260px] sm:min-h-[320px]">
      <CardHeader className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <h2 className="font-extrabold text-slate-900 tracking-tight">Live Gate Scans</h2>
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realtime Feed</span>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-[320px] pr-2">
        {scans.length === 0 ? (
          <p className="text-sm text-slate-400 py-12 text-center">No scans recorded today.</p>
        ) : (
          <div className="space-y-3">
            {scans.slice(0, 8).map((scan) => (
              <ScanRow key={`${scan.identifierCode}-${scan.scannedAt}`} scan={scan} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScanRow({ scan }: { scan: LiveScanEvent }) {
  const initials = scan.studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const scanTime = scan.scannedAt ? new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-primary-100/50 hover:bg-slate-50/50 transition-all duration-300 shadow-sm shadow-slate-100/20">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200/50 shrink-0">{initials}</div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-950 truncate">{scan.studentName}</p>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
            {scan.rollNumber} · {scan.identifierCode} {scanTime && `· ${scanTime}`}
          </p>
        </div>
      </div>
      <Badge variant={scan.status === 'PRESENT' ? 'success' : scan.status === 'LATE' ? 'warning' : 'info'}>{scan.status}</Badge>
    </div>
  );
}
