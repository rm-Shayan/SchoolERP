'use client';

import { useMemo } from 'react';
import { StatsCard } from '@/features/shared/components';
import type { Exam } from '@/types';
import type { Term } from '@/lib/api/academicService';

interface Props {
  exams: Exam[];
  terms: Term[];
}

const ICONS = {
  total: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  up: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  done: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  terms: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

export default function ExamStatCards({ exams, terms }: Props) {
  const stats = useMemo(() => {
    const now = Date.now();
    return [
      { title: 'Total Exams', value: exams.length, subtitle: 'This academic year', icon: ICONS.total, tint: 'sa-tint-1' },
      { title: 'Upcoming', value: exams.filter((e) => new Date(e.endDate).getTime() >= now).length, subtitle: 'Not yet finished', icon: ICONS.up, tint: 'sa-tint-3' },
      { title: 'Completed', value: exams.filter((e) => new Date(e.endDate).getTime() < now).length, subtitle: 'Already held', icon: ICONS.done, tint: 'sa-tint-2' },
      { title: 'Terms', value: terms.length, subtitle: 'In selected year', icon: ICONS.terms, tint: 'sa-tint-4' },
    ];
  }, [exams, terms]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {stats.map((s, i) => (
        <StatsCard key={s.title} index={i} {...s} />
      ))}
    </div>
  );
}