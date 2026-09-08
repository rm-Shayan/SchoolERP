'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import type { AttendanceRecord } from '@/types';
import { exportToCsv } from './attendanceExport';
import toast from 'react-hot-toast';

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  LATE: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ABSENT: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  LEAVE: { bg: 'bg-primary-50', text: 'text-primary-600', dot: 'bg-primary-500' },
  HALF_DAY: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
  MANUAL_OVERRIDE: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
};

interface Props {
  className: string;
  sectionName: string;
  sectionId: string;
  date: string;
  records: AttendanceRecord[];
  totalStudents?: number;
  isOpen: boolean;
  onToggle: () => void;
}

const safeFile = (s: string) => s.trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '') || 'section';

export default function SectionDayCard({ className, sectionName, sectionId, date, records, totalStudents, isOpen, onToggle }: Props) {
  const { organization } = useAppSelector((s) => s.auth);
  const slug = organization?.slug;
  const detailPath = slug
    ? `/o/${slug}/branch/attendance/records/${sectionId}?date=${date}`
    : `/branch/attendance/records/${sectionId}?date=${date}`;

  const p = records.filter((r) => r.status === 'PRESENT').length;
  const l = records.filter((r) => r.status === 'LATE').length;
  const a = records.filter((r) => r.status === 'ABSENT').length;
  const lv = records.filter((r) => r.status === 'LEAVE').length;
  const hd = records.filter((r) => r.status === 'HALF_DAY').length;
  const unmarked = totalStudents !== undefined ? Math.max(totalStudents - records.length, 0) : undefined;

  const handleExport = () => {
    if (records.length === 0) { toast.error('No records to export for this section'); return; }
    exportToCsv(records, `attendance-daily-${safeFile(className)}-${safeFile(sectionName)}-${date}`);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 p-4">
        <button type="button" onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:opacity-80">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-700">{className.charAt(0)}</div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">{className} — {sectionName}</p>
            <p className="text-[11px] text-gray-400">
              {records.length} marked{totalStudents !== undefined ? ` of ${totalStudents} students` : ''}
              {unmarked !== undefined && unmarked > 0 ? ` · ${unmarked} unmarked` : ''}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{p}P</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{l}L</span>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">{a}A</span>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-600">{lv}Lv</span>
          {hd > 0 && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">{hd}HD</span>}
          <button type="button" onClick={handleExport} title="Export this section's CSV"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-primary-50 hover:text-primary-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
          </button>
          <button type="button" onClick={onToggle} title={isOpen ? 'Collapse' : 'Expand'}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100">
            <svg className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-gray-100">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50/80">
              <th className="px-4 py-2 text-left text-[11px] font-bold uppercase text-gray-500">Student</th>
              <th className="px-4 py-2 text-center text-[11px] font-bold uppercase text-gray-500">Status</th>
              <th className="px-4 py-2 text-center text-[11px] font-bold uppercase text-gray-500">Check In</th>
            </tr></thead>
            <tbody>{records.map((r) => {
              const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.PRESENT;
              return (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-900">{r.student?.firstName} {r.student?.lastName}</p>
                    <p className="text-[10px] text-gray-400">#{r.student?.rollNumber}</p>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', st.bg, st.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />{r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-gray-500 tabular-nums">
                    {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
          {records.length === 0 && <p className="py-6 text-center text-xs text-gray-400">No attendance records for this section on this day.</p>}
          <div className="border-t border-gray-50 bg-gray-50/30 p-3">
            <Link href={detailPath}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100">
              View Full Details
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
