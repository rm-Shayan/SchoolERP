'use client';

import { useEffect, useMemo, useState } from 'react';
import { staffAttendanceService } from '@/lib/api';
import type { StaffDailyReport } from '@/lib/api/staffAttendanceService';
import { Card, CardContent } from '@/features/shared/components';
import { getStatusColor } from '@/lib/utils';

interface Props {
  staffId: string;
}

interface MonthStat {
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
}

export default function StaffAttendanceSummary({ staffId }: Props) {
  const [report, setReport] = useState<StaffDailyReport | null>(null);
  const [monthStat, setMonthStat] = useState<MonthStat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    Promise.all([
      staffAttendanceService.getDailyReport(today),
      staffAttendanceService.getMonthlyReport(now.getFullYear(), now.getMonth() + 1),
    ])
      .then(([dailyRes, monthlyRes]) => {
        if (cancelled) return;
        setReport(dailyRes.data.data);

        const rec = monthlyRes.data.data;
        const member = rec.records.find((r) => r.staff.id === staffId);
        if (member) {
          const days = Object.values(member.days);
          setMonthStat({
            present: days.filter((s) => s === 1).length,
            late: days.filter((s) => s === 2).length,
            absent: days.filter((s) => s === 3).length,
            leave: days.filter((s) => s === 4).length,
            total: member.total,
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [staffId]);

  const todayRecord = useMemo(() => {
    return report?.staff.find((s) => s.id === staffId)?.attendance ?? null;
  }, [report, staffId]);

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-6">Loading attendance…</p>;
  }

  const ms = monthStat;

  return (
    <div className="space-y-4">
      {/* Today's status */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Today</h4>
          {todayRecord ? (
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(todayRecord.status)}`}>
                  {todayRecord.status}
                </span>
                {todayRecord.checkIn && (
                  <span className="ml-2 text-xs text-gray-500">
                    In: {new Date(todayRecord.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No record today</p>
          )}
        </CardContent>
      </Card>

      {/* Monthly overview */}
      {ms && ms.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">This Month</h4>
            <div className="grid grid-cols-4 gap-2">
              <StatChip label="Present" value={ms.present} color="bg-emerald-100 text-emerald-700" />
              <StatChip label="Late" value={ms.late} color="bg-amber-100 text-amber-700" />
              <StatChip label="Absent" value={ms.absent} color="bg-red-100 text-red-700" />
              <StatChip label="Leave" value={ms.leave} color="bg-primary-100 text-primary-700" />
            </div>
            {ms.total > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.round((ms.present / ms.total) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  {Math.round((ms.present / ms.total) * 100)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!ms && !todayRecord && (
        <p className="text-sm text-gray-400 text-center py-4">No attendance data found.</p>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-2 text-center ${color}`}>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
    </div>
  );
}
