'use client';

import { memo, useMemo } from 'react';
import { StatsCard } from '@/features/shared/components';

interface DashboardStatsProps {
  assignmentsCount: number;
  timetableCount: number;
  upcomingPtms: number;
  recentHomework: number;
}

const DashboardStats = memo(function DashboardStats({
  assignmentsCount,
  timetableCount,
  upcomingPtms,
  recentHomework,
}: DashboardStatsProps) {
  const items = useMemo(
    () => [
      { title: 'My Sections', value: assignmentsCount, subtitle: 'Teaching assignments', tint: 'bg-violet-100 text-violet-600' },
      { title: 'Today\'s Classes', value: timetableCount, subtitle: 'Periods scheduled', tint: 'bg-sky-100 text-sky-600' },
      { title: 'Upcoming PTMs', value: upcomingPtms, subtitle: 'Meetings lined up', tint: 'bg-amber-100 text-amber-600' },
      { title: 'Homework Posts', value: recentHomework, subtitle: 'Recent assignments', tint: 'bg-emerald-100 text-emerald-600' },
    ],
    [assignmentsCount, timetableCount, upcomingPtms, recentHomework],
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item, i) => (
        <StatsCard key={item.title} {...item} icon={<span className="text-lg">{i === 0 ? '📚' : i === 1 ? '🕐' : i === 2 ? '🤝' : '📝'}</span>} index={i} />
      ))}
    </div>
  );
});

export default DashboardStats;
