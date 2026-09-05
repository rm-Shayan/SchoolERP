'use client';

import { useCallback, useEffect, useState } from 'react';
import { orgService } from '@/lib/api';
import type { OrgDashboard } from '@/types';
import { Button, SectionHeader } from '@/features/shared/components';
import StaffVsStudentsChart from './StaffVsStudentsChart';
import RevenueChart from './RevenueChart';
import EnrollmentChart from './EnrollmentChart';
import AttendanceRateChart from './AttendanceRateChart';
import FeeSummaryCard from './FeeSummaryCard';
import StaffTable from './StaffTable';

interface OrgDashboardSectionProps {
  organizationId: string;
}

export default function OrgDashboardSection({ organizationId }: OrgDashboardSectionProps) {
  const [data, setData] = useState<OrgDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await orgService.getDashboard(organizationId));
    } catch (err) {
      console.error('Failed to load org dashboard:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-gradient-to-br from-violet-100/40 to-violet-50/30 rounded-2xl border border-violet-200/20" />
          <div className="h-72 bg-gradient-to-br from-violet-100/40 to-violet-50/30 rounded-2xl border border-violet-200/20" />
        </div>
        <div className="h-64 bg-gradient-to-br from-violet-100/40 to-violet-50/30 rounded-2xl border border-violet-200/20" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/60 p-8 text-center shadow-sm">
        <p className="text-gray-500 text-sm mb-3">Could not load the organization dashboard.</p>
        <Button variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Organization Dashboard"
        subtitle="Branch performance, revenue and staff overview."
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StaffVsStudentsChart branches={data.branches} />
        <RevenueChart revenue={data.revenue} />
      </div>
      {data.enrollment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EnrollmentChart monthly={data.enrollment.monthly} />
          {data.attendance && <AttendanceRateChart monthly={data.attendance.monthly} />}
        </div>
      )}
      {data.fees && <FeeSummaryCard fees={data.fees} />}
      <StaffTable staff={data.staff} />
    </div>
  );
}
