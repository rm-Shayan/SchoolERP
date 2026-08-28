'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalOverview } from '@/types/portal';
import { formatDate } from '@/lib/utils';
import { getOrgThemeColor, hexToRgb } from '@/lib/utils/orgTheme';
import { OverviewSkeleton } from './PortalSkeletonsA';
import { LiveBadge, RecentEvents } from './OverviewLiveEvents';

export default function OverviewTab() {
  const [data, setData] = useState<PortalOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalDataService.getOverview().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <OverviewSkeleton />;
  if (!data) return <p className="text-center text-gray-500 py-12">No data available</p>;

  return (
    <div className="space-y-4">
      <LiveBadge />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AttendanceRing percentage={data.attendance.percentage} summary={data.attendance} />
        <FeeStatusCard summary={data.fees} />
      </div>
      <QuickStats homeworkCount={data.homeworkCount} circularCount={data.circularCount} outstanding={data.fees.outstanding} />
      <RecentEvents />
    </div>
  );
}

function AttendanceRing({ percentage, summary }: { percentage: number; summary: PortalOverview['attendance'] }) {
  const theme = getOrgThemeColor();
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color = theme || '#22c55e';
  const ringColor = percentage >= 75 ? color : percentage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-gray-900 text-sm">Attendance This Month</h3>
      </CardHeader>
      <CardContent className="flex items-center gap-6 pt-0">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle cx="50" cy="50" r={r} fill="none" stroke={ringColor} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">{percentage}%</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm flex-1">
          <StatChip label="Present" value={summary.present} color="#22c55e" />
          <StatChip label="Late" value={summary.late} color="#f59e0b" />
          <StatChip label="Absent" value={summary.absent} color="#ef4444" />
          <StatChip label="Leave" value={summary.leave} color="#3b82f6" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: `${color}12` }}>
      <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function FeeStatusCard({ summary }: { summary: PortalOverview['fees'] }) {
  const theme = getOrgThemeColor();
  const outstanding = Number(summary.outstanding);
  const paid = Number(summary.totalPaid);
  const charged = Number(summary.totalCharged);
  const pct = charged > 0 ? Math.round((paid / charged) * 100) : 0;

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-gray-900 text-sm">Fee Status</h3>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-2xl font-extrabold text-gray-900">Rs. {paid.toLocaleString()}</p>
            <p className="text-xs text-gray-500">of Rs. {charged.toLocaleString()} paid</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${theme || '#22c55e'}15`, color: theme || '#16a34a' }}>{pct}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: theme || '#22c55e' }} />
        </div>
        {outstanding > 0 ? (
          <div className="rounded-xl p-3 text-center" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-sm font-semibold text-red-700">Rs. {outstanding.toLocaleString()} outstanding</p>
            <p className="text-xs text-red-500 mt-0.5">{summary.unpaid + summary.partial} unpaid/partial record(s)</p>
          </div>
        ) : (
          <div className="rounded-xl p-3 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-sm font-semibold text-green-700">All fees paid ✓</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickStats({ homeworkCount, circularCount, outstanding }: { homeworkCount: number; circularCount: number; outstanding: string }) {
  const theme = getOrgThemeColor();
  const items = [
    { label: 'Homework', value: homeworkCount, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { label: 'Notices', value: circularCount, icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { label: 'Dues', value: Number(outstanding) > 0 ? '!' : '✓', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', isAlert: Number(outstanding) > 0 },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((s) => (
        <Card key={s.label} className="p-4 text-center hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: s.isAlert ? '#fef2f2' : theme ? `${theme}12` : '#eff6ff' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={s.isAlert ? '#ef4444' : theme || '#3b82f6'}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
            </svg>
          </div>
          <p className="text-xl font-bold" style={{ color: s.isAlert ? '#ef4444' : theme || '#2563eb' }}>{s.value}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}
