'use client';

import { memo, useMemo } from 'react';
import type { PlatformOverview } from '@/types';
import OrgLeaderboard from './OrgLeaderboard';
import OrgChartsSection from './OrgChartsSection';
import OrgStatusActions from './OrgStatusActions';

interface OrgsBottomSectionProps {
  overview: PlatformOverview | null;
}

const OrgsBottomSection = memo(function OrgsBottomSection({ overview }: OrgsBottomSectionProps) {
  const orgs = overview?.organizations ?? [];
  const topRev = useMemo(() => [...orgs].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0)).slice(0, 5), [orgs]);
  const topStd = useMemo(() => [...orgs].sort((a, b) => b.studentCount - a.studentCount).slice(0, 5), [orgs]);
  const maxRev = topRev[0]?.revenue ?? 1;
  const maxStd = topStd[0]?.studentCount ?? 1;

  if (orgs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Row 1: Leaderboards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <OrgLeaderboard title="Top by Revenue" items={topRev} max={maxRev} field="revenue"
          hoverColor="hover:bg-violet-50/40" barColor="bg-gradient-to-r from-amber-400 to-amber-500" />
        <OrgLeaderboard title="Top by Students" items={topStd} max={maxStd} field="studentCount"
          hoverColor="hover:bg-emerald-50/40" barColor="bg-gradient-to-r from-emerald-400 to-emerald-500" />
      </div>

      {/* Row 2: Charts */}
      <OrgChartsSection overview={overview} />

      {/* Row 3: Status + Quick Actions */}
      <OrgStatusActions stats={overview?.stats} orgCount={orgs.length} />
    </div>
  );
});

export default OrgsBottomSection;
