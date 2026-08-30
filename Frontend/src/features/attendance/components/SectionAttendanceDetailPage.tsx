'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useParams } from 'next/navigation';
import SectionDetailDaily from './parts/SectionDetailDaily';
import SectionMonthPanel from './parts/SectionMonthPanel';
import { cn } from '@/lib/utils';

export default function SectionAttendanceDetailPage() {
  const params = useParams();
  const sectionId = params?.sectionId as string;
  const { organization } = useAppSelector((s) => s.auth);
  const slug = organization?.slug;
  const [mode, setMode] = useState<'daily' | 'monthly'>('daily');

  const backPath = slug ? `/o/${slug}/branch/attendance/records` : '/branch/attendance/records';

  return (
    <div className="space-y-5">
      <div>
        <Link href={backPath} className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Records
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Section Attendance</h1>
      </div>

      <div className="flex w-fit gap-1 rounded-xl bg-gray-100 p-1">
        {([
          { key: 'daily' as const, label: '📅 Daily' },
          { key: 'monthly' as const, label: '📊 Monthly' },
        ]).map((t) => (
          <button key={t.key} onClick={() => setMode(t.key)}
            className={cn('rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              mode === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {mode === 'daily' ? (
        <SectionDetailDaily sectionId={sectionId} sectionName="" className="" />
      ) : (
        <SectionMonthPanel sectionId={sectionId} />
      )}
    </div>
  );
}