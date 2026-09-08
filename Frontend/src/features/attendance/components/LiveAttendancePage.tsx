'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { attendanceService } from '@/lib/api/attendanceService';
import type { AttendanceRecord, DailyAttendanceSummary } from '@/types';
import type { LiveScanEvent } from '@/store/slices/socketSlice';
import { PageHeader, Card, CardHeader, CardContent, EmptyState } from '@/features/shared/components';
import { VirtualizedList } from '@/features/shared/components/VirtualizedList';
import { cn } from '@/lib/utils';
import { ROW_H, BADGE, DOT, time } from './parts/liveAttendanceUi';
import { StudentAvatar } from './parts/StudentAvatar';

function StatBox({ title, value, color, icon }: { title: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>{icon}</div>
        <div>
          <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{value}</p>
          <p className="text-xs font-medium text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );
}

const Icon = ({ d, c }: { d: string; c?: string }) => (
  <svg className={cn('w-5 h-5', c)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

export default function LiveAttendancePage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const scanHistory = useAppSelector((s) => s.socket.scanHistory);
  const [summary, setSummary] = useState<DailyAttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'MANUAL_OVERRIDE'>('ALL');

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const report = await attendanceService.getDailyReport({ schoolId });
      setSummary(report.summary);
      setRecords(report.records);
    } catch {} finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t); }, [load]);

  const statusFilterOptions: { label: string; value: 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'MANUAL_OVERRIDE' }[] = [
    { label: 'ALL', value: 'ALL' },
    { label: 'Present', value: 'PRESENT' },
    { label: 'Late', value: 'LATE' },
    { label: 'Absent', value: 'ABSENT' },
    { label: 'Leave', value: 'LEAVE' },
    { label: 'Manual Override', value: 'MANUAL_OVERRIDE' },
  ];

  const filtered = useMemo(
    () => {
      if (filter === 'ALL') return records;
      return records.filter((r) => r.status === filter);
    }, [records, filter]
  );

  const renderRecord = (r: AttendanceRecord) => (
    <div className="flex items-center gap-3 px-4 border-b border-gray-100 hover:bg-gray-50/80 h-full transition-colors">
      <StudentAvatar imageUrl={r.student?.imageUrl} firstName={r.student?.firstName} lastName={r.student?.lastName} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{r.student?.firstName} {r.student?.lastName}</p>
        <p className="text-xs text-gray-400">#{r.student?.rollNumber} · {r.student?.section?.class?.name} {r.student?.section?.name}</p>
      </div>
      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0', BADGE[r.status])}>
        {r.status.replace('_', ' ')}
      </span>
      <span className="text-xs text-gray-400 w-14 text-right shrink-0 tabular-nums">{time(r.checkIn)}</span>
    </div>
  );

  const renderLive = (scan: LiveScanEvent) => (
    <div className="flex items-center gap-3 px-4 border-b border-gray-100 hover:bg-gray-50/80 h-full transition-colors">
      <span className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', DOT[scan.status] ?? 'bg-gray-400')} />
      <StudentAvatar firstName={scan.studentName?.split(' ')[0]} lastName={scan.studentName?.split(' ').slice(1).join(' ')} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{scan.studentName}</p>
        <p className="text-xs text-gray-400">#{scan.rollNumber}</p>
      </div>
      <span className="text-xs capitalize text-gray-500 font-medium">{scan.status.replace('_', ' ').toLowerCase()}</span>
      <span className="text-xs text-gray-400 w-14 text-right shrink-0 tabular-nums">{time(scan.scannedAt)}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Live Attendance" description="Realtime gate scans via WebSocket — handles 10,000+ students smoothly." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox title="Present" value={summary?.present ?? 0} color="bg-emerald-50" icon={<Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" c="text-emerald-600" />} />
        <StatBox title="Late" value={summary?.late ?? 0} color="bg-amber-50" icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" c="text-amber-600" />} />
        <StatBox title="Absent" value={summary?.absent ?? 0} color="bg-red-50" icon={<Icon d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" c="text-red-500" />} />
        <StatBox title="Live Scans" value={scanHistory.length} color="bg-primary-50" icon={<Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" c="text-primary-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="font-bold text-gray-900">Live Gate Feed</h2>
            </div>
            <span className="text-xs text-gray-400">Every scan shows here instantly via WebSocket</span>
          </CardHeader>
          <CardContent className="p-0">
            {scanHistory.length === 0
              ? <EmptyState className="py-10" icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12v4m0 0h4M8 8l8 8" /></svg>} title="No scans yet" description="Scan a QR at the gate — every scan shows here instantly." />
              : <VirtualizedList items={scanHistory} rowHeight={ROW_H} height={420} getKey={(s) => `${s.identifierCode}-${s.scannedAt}`} renderRow={renderLive} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <h2 className="font-bold text-gray-900">Attendance Records</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {statusFilterOptions.map((opt) => (
                <button key={opt.value} onClick={() => setFilter(opt.value)} className={cn(
                  'px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all',
                  filter === opt.value ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                )}>{opt.label}</button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading
              ? <div className="py-16 px-5 space-y-3 animate-pulse">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4">
                      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 bg-gray-200 rounded" />
                        <div className="h-2.5 w-48 bg-gray-100 rounded" />
                      </div>
                      <div className="h-5 w-16 bg-gray-200 rounded-full shrink-0" />
                    </div>
                  ))}
                </div>
              : filtered.length === 0
                ? <p className="text-sm text-gray-400 text-center py-16">No records match this filter.</p>
                : <VirtualizedList items={filtered} rowHeight={ROW_H} height={420} getKey={(r) => r.id} renderRow={renderRecord} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}