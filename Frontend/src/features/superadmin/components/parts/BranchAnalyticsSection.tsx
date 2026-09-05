'use client';

import { useCallback, useEffect, useState } from 'react';
import { schoolService } from '@/lib/api';
import { Card, Button, SectionHeader } from '@/features/shared/components';
import EnrollmentChart from './EnrollmentChart';
import AttendanceRateChart from './AttendanceRateChart';
import FeeSummaryCard from './FeeSummaryCard';

interface BranchAnalyticsSectionProps {
  schoolId: string;
}

export default function BranchAnalyticsSection({ schoolId }: BranchAnalyticsSectionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setData(await schoolService.getAnalytics(schoolId)); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        <div className="h-72 bg-gray-100 rounded-2xl" />
        <div className="h-72 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500 text-sm mb-3">Could not load branch analytics.</p>
        <Button variant="outline" size="sm" onClick={load}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Branch Analytics"
        subtitle="Monthly enrollment, attendance rate and fee collection for this branch."
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.enrollment && <EnrollmentChart monthly={data.enrollment.monthly} />}
        {data.attendance && <AttendanceRateChart monthly={data.attendance.monthly} />}
      </div>
      {data.fees && <FeeSummaryCard fees={data.fees} />}
    </div>
  );
}
