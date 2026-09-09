'use client';

import { useEffect, useState } from 'react';
import { studentService, attendanceService, admissionService, feeService } from '@/lib/api';
import type { AdmissionFunnelStats } from '@/lib/api/admissionService';

export interface ClassAttendanceDatum {
  name: string;
  Present: number;
  Late: number;
  Absent: number;
}

export interface FeeStatusDatum {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  activeStudents: number;
  presentToday: number;
  feesCollected: number;
  funnel: AdmissionFunnelStats | null;
  classAttendance: ClassAttendanceDatum[];
  feeStatus: FeeStatusDatum[];
}

const EMPTY: DashboardData = {
  activeStudents: 0,
  presentToday: 0,
  feesCollected: 0,
  funnel: null,
  classAttendance: [],
  feeStatus: [],
};

/** Full org-admin dashboard data load + derived chart datasets. */
export function useDashboardData(schoolId?: string) {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const now = new Date();
        const results = await Promise.allSettled([
          studentService.getStats(schoolId),
          attendanceService.getDailyReport({ schoolId }),
          feeService.getSummary({ schoolId }),
        ]);
        if (!alive) return;
        const statsData = results[0].status === 'fulfilled' ? results[0].value : null;
        const daily = results[1].status === 'fulfilled' ? results[1].value : null;
        const summary = results[2].status === 'fulfilled' ? results[2].value : null;
        const rawCounts = summary?.counts;
        const feeStatus: FeeStatusDatum[] = [
          { name: 'Paid', value: rawCounts?.PAID ?? 0, color: '#10b981' },
          { name: 'Partial', value: rawCounts?.PARTIAL ?? 0, color: '#f59e0b' },
          { name: 'Unpaid', value: rawCounts?.UNPAID ?? 0, color: '#94a3b8' },
          { name: 'Overdue', value: rawCounts?.OVERDUE ?? 0, color: '#ef4444' },
        ].filter((d) => d.value > 0);

        setData({
          ...EMPTY,
          activeStudents: statsData?.ACTIVE ?? 0,
          presentToday: (daily?.summary?.present ?? 0) + (daily?.summary?.late ?? 0),
          feesCollected: summary?.collected ?? 0,
          feeStatus,
        });
        setLoading(false);

        setHydrating(true);
        const [funnelResult, monthlyResult] = await Promise.allSettled([
          admissionService.getFunnel(schoolId).catch(() => null),
          attendanceService.getMonthlyReport({ schoolId, year: now.getFullYear(), month: now.getMonth() + 1 }).catch(() => null),
        ]);
        if (!alive) return;
        const funnelData = funnelResult.status === 'fulfilled' ? funnelResult.value : null;
        const monthly = monthlyResult.status === 'fulfilled' ? monthlyResult.value : null;
        setData((current) => ({ ...current,
          funnel: funnelData,
          classAttendance: (monthly?.classes ?? []).map((c) => ({
            name: c.className,
            Present: c.sections.reduce((t, s) => t + (s.summary?.present ?? 0), 0),
            Late: c.sections.reduce((t, s) => t + (s.summary?.late ?? 0), 0),
            Absent: c.sections.reduce((t, s) => t + (s.summary?.absent ?? 0), 0),
          })),
        }));
        setHydrating(false);
      } catch {
        // silent — dashboard defaults are shown
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [schoolId]);

  return { data, loading, hydrating };
}
