'use client';

import { useEffect, useState } from 'react';
import { studentService, attendanceService, admissionService, feeService } from '@/lib/api';
import type { AdmissionFunnelStats } from '@/lib/api/admissionService';
import type { Student } from '@/types';

export interface ClassAttendanceDatum {
  name: string;
  Present: number;
  Late: number;
  Absent: number;
}

export interface ClassStrengthDatum {
  name: string;
  Students: number;
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
  classStrength: ClassStrengthDatum[];
  feeStatus: FeeStatusDatum[];
}

const EMPTY: DashboardData = {
  activeStudents: 0,
  presentToday: 0,
  feesCollected: 0,
  funnel: null,
  classAttendance: [],
  classStrength: [],
  feeStatus: [],
};

function buildClassStrength(students: Student[]): ClassStrengthDatum[] {
  const byClass = new Map<string, number>();
  for (const s of students) {
    const key = s.section?.class?.name ?? s.section?.name ?? 'Unassigned';
    byClass.set(key, (byClass.get(key) ?? 0) + 1);
  }
  return [...byClass.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([name, count]) => ({ name, Students: count }));
}

/** Org-admin dashboard ka poora data load + derived chart datasets. */
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
          studentService.getAll({ schoolId }),
          attendanceService.getDailyReport({ schoolId }),
          feeService.getSummary({ schoolId }),
        ]);
        if (!alive) return;
        const studentsData = results[0].status === 'fulfilled' ? results[0].value : [];
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
          activeStudents: studentsData.filter((s) => s.status === 'ACTIVE').length,
          presentToday: (daily?.summary?.present ?? 0) + (daily?.summary?.late ?? 0),
          feesCollected: summary?.collected ?? 0,
          classStrength: buildClassStrength(studentsData),
          feeStatus,
        });
        setLoading(false);

        // Heavy reports hydrate after the critical dashboard cards are visible.
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
        // silent — dashboard defaults dikhta hai
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
