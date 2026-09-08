import type { LiveScanEvent } from '@/store/slices/socketSlice';
import { cn } from '@/lib/utils';
import { StudentAvatar } from './parts/StudentAvatar';

interface Props { scans: LiveScanEvent[]; dark?: boolean; }

const DOT: Record<string, string> = {
  PRESENT: 'bg-emerald-400', LATE: 'bg-amber-400', ABSENT: 'bg-red-400',
  MANUAL_OVERRIDE: 'bg-primary-400',
};

const BADGE: Record<string, string> = {
  PRESENT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  LATE: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  ABSENT: 'bg-red-500/15 text-red-400 border-red-500/20',
  MANUAL_OVERRIDE: 'bg-primary-500/15 text-primary-400 border-primary-500/20',
};

function ScanRow({ scan, dark }: { scan: LiveScanEvent; dark: boolean }) {
  const time = new Date(scan.scannedAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const badge = BADGE[scan.status] ?? BADGE.PRESENT;
  const dot = DOT[scan.status] ?? 'bg-gray-400';

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 border-b transition-all duration-300 animate-in fade-in slide-in-from-left-2',
      dark ? 'border-gray-800/50 hover:bg-gray-800/30' : 'border-gray-100 hover:bg-gray-50'
    )}>
      <StudentAvatar imageUrl={scan.imageUrl} firstName={scan.studentName?.split(' ')[0]} lastName={scan.studentName?.split(' ').slice(1).join(' ')} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold truncate', dark ? 'text-white' : 'text-gray-900')}>{scan.studentName}</p>
        <p className={cn('text-xs', dark ? 'text-gray-500' : 'text-gray-400')}>#{scan.rollNumber}</p>
      </div>
      <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shrink-0', badge)}>
        <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
        {scan.status.replace('_', ' ')}
      </div>
      <span className={cn('text-xs tabular-nums shrink-0', dark ? 'text-gray-500' : 'text-gray-400')}>{time}</span>
    </div>
  );
}

export default function ScanHistoryTable({ scans, dark = false }: Props) {
  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className={cn('w-16 h-16 rounded-2xl border flex items-center justify-center mb-4', dark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-primary-50 border-primary-100')}>
          <svg className={cn('w-8 h-8', dark ? 'text-gray-600' : 'text-primary-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className={cn('text-sm font-medium', dark ? 'text-gray-400' : 'text-slate-700')}>No scans yet</p>
        <p className={cn('text-xs mt-1', dark ? 'text-gray-600' : 'text-slate-400')}>Point camera at a student QR code to begin</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
      {scans.map((scan) => (
        <ScanRow key={`${scan.identifierCode}-${scan.scannedAt}`} scan={scan} dark={dark} />
      ))}
    </div>
  );
}
