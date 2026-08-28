'use client';

import { memo } from 'react';
import { StatsCard } from '@/features/shared/components';

interface TrackingStatsProps {
  totalHomework: number;
  thisWeek: number;
  activeTeachers: number;
}

const BookIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" />
  </svg>
);

const TrackingStats = memo(function TrackingStats({ totalHomework, thisWeek, activeTeachers }: TrackingStatsProps) {
  const stats = [
    { title: 'Total Homework', value: totalHomework, subtitle: 'All sections', icon: <BookIcon />, tint: 'sa-tint-1' },
    { title: 'This Week', value: thisWeek, subtitle: 'Last 7 days', icon: <CalendarIcon />, tint: 'sa-tint-2' },
    { title: 'Teachers Active', value: activeTeachers, subtitle: 'Posted homework', icon: <UsersIcon />, tint: 'sa-tint-3' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <StatsCard key={s.title} index={i} {...s} />
      ))}
    </div>
  );
});

export default TrackingStats;
