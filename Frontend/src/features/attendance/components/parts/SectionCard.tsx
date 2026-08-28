'use client';
import Link from 'next/link';
import type { SectionAttendanceSummary } from '@/types';

interface Props {
  section: SectionAttendanceSummary;
  detailPath: string;
}

export default function SectionCard({ section, detailPath }: Props) {
  const { summary, className, sectionName } = section;
  const total = Math.max(summary.present + summary.late + summary.absent + summary.leave + summary.manualOverride, 1);
  const pPct = Math.round((summary.present / total) * 100);
  const lPct = Math.round((summary.late / total) * 100);

  return (
    <Link href={detailPath}
      className="block rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:border-primary-200 transition-all group">
      <div className="flex items-center justify-between py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 group-hover:bg-primary-100 transition-colors">
            {className?.slice(0, 3)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{className} — {sectionName}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{summary.totalStudents} students</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-xs font-bold text-emerald-600">{summary.present}</span>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-amber-600">{summary.late}</span>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-red-500">{summary.absent}</span>
          </div>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
          <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${pPct}%` }} />
          <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${lPct}%` }} />
        </div>
      </div>
    </Link>
  );
}
