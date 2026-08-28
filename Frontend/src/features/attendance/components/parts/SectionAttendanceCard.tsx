'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import { BADGE } from './liveAttendanceUi';
import { StudentAvatar } from './StudentAvatar';
import type { SectionAttendanceSummary } from '@/types';

interface Props { section: SectionAttendanceSummary; onOverride: (studentId: string, date: string) => void; }

export default function SectionAttendanceCard({ section, onOverride }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { summary, records, className, sectionName } = section;
  const total = Math.max(summary.present + summary.late + summary.absent + summary.leave + summary.manualOverride, 1);
  const pPct = Math.round((summary.present / total) * 100);
  const lPct = Math.round((summary.late / total) * 100);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <CardHeader className="flex flex-row items-center justify-between py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
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
            <svg className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', expanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </CardHeader>
        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${pPct}%` }} />
            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${lPct}%` }} />
          </div>
        </div>
      </button>

      {expanded && (
        <CardContent className="p-0 border-t border-gray-100">
          <div className="max-h-80 overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No records for this section.</p>
            ) : records.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                <StudentAvatar imageUrl={r.student?.imageUrl} firstName={r.student?.firstName} lastName={r.student?.lastName} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.student?.firstName} {r.student?.lastName}</p>
                  <p className="text-[11px] text-gray-400">#{r.student?.rollNumber} · {new Date(r.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className={cn('inline-flex px-2 py-0.5 rounded-lg text-[11px] font-semibold border shrink-0', BADGE[r.status] ?? '')}>
                  {r.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400 w-14 text-right shrink-0 tabular-nums">
                  {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onOverride(r.studentId, r.date); }} className="text-xs shrink-0">
                  Override
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
