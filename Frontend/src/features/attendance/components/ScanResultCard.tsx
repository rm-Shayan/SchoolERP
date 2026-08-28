'use client';

import { useEffect, useRef } from 'react';
import type { ScanResult } from '@/lib/api/attendanceService';
import { cn } from '@/lib/utils';
import { StudentAvatar } from './parts/StudentAvatar';
import FeeStatusBadge from './parts/FeeStatusBadge';

interface Props { result: ScanResult; dark?: boolean; }

const STATUS: Record<string, { label: string; color: string; ring: string }> = {
  PRESENT: { label: 'Check In', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', ring: 'ring-emerald-500/30' },
  LATE: { label: 'Late Entry', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', ring: 'ring-amber-500/30' },
  ABSENT: { label: 'Absent', color: 'bg-red-500/15 text-red-400 border-red-500/30', ring: 'ring-red-500/30' },
  CHECK_OUT: { label: 'Check Out', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', ring: 'ring-blue-500/30' },
};

function playBeep(freq = 880) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export default function ScanResultCard({ result, dark = false }: Props) {
  const prevRef = useRef('');
  const cfg = STATUS[result.status] ?? STATUS.PRESENT;
  const time = new Date(result.scannedAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (result.status === 'not_found') {
    return (
      <div className={cn('rounded-2xl border p-4 animate-in fade-in duration-400', dark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white border-gray-200')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </div>
          <div>
            <p className={cn('font-bold', dark ? 'text-white' : 'text-gray-900')}>Student Not Found</p>
            <p className={cn('text-sm', dark ? 'text-gray-400' : 'text-gray-500')}>Code: {result.identifierCode}</p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (result.identifierCode !== prevRef.current) {
      prevRef.current = result.identifierCode;
      playBeep(result.status === 'ABSENT' ? 440 : 880);
    }
  }, [result]);

  return (
    <div className={cn(
      'rounded-2xl border overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-400',
      dark ? 'bg-gray-900/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white border-gray-200 shadow-lg shadow-gray-100/50'
    )}>
      {/* Status accent bar */}
      <div className={cn('h-1', result.status === 'PRESENT' ? 'bg-emerald-500' : result.status === 'LATE' ? 'bg-amber-500' : result.status === 'CHECK_OUT' ? 'bg-blue-500' : 'bg-red-500')} />
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <StudentAvatar imageUrl={result.imageUrl} firstName={result.studentName.split(' ')[0]} lastName={result.studentName.split(' ').slice(1).join(' ')} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('font-bold truncate', dark ? 'text-white' : 'text-gray-900')}>{result.studentName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className={cn('text-sm', dark ? 'text-gray-400' : 'text-gray-500')}>Roll #{result.rollNumber}</p>
              <span className="text-gray-600">·</span>
              <p className={cn('text-xs', dark ? 'text-gray-500' : 'text-gray-400')}>{time}</p>
            </div>
          </div>
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0', cfg.color)}>
            {cfg.label}
          </div>
        </div>
        {result.feeStatus?.records && result.feeStatus.records.length > 0 && (
          <FeeStatusBadge records={result.feeStatus.records} term={result.feeStatus.term} dark={dark} />
        )}
      </div>
    </div>
  );
}
