'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import type { AttendanceRecord } from '@/types';

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  LATE: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ABSENT: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  LEAVE: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
};

interface Props {
  className: string;
  sectionName: string;
  sectionId: string;
  date: string;
  records: AttendanceRecord[];
  isOpen: boolean;
  onToggle: () => void;
}

export default function SectionDayCard({ className, sectionName, sectionId, date, records, isOpen, onToggle }: Props) {
  const { organization } = useAppSelector((s) => s.auth);
  const slug = organization?.slug;
  const detailPath = slug
    ? `/o/${slug}/branch/attendance/records/${sectionId}?date=${date}`
    : `/branch/attendance/records/${sectionId}?date=${date}`;

  const p = records.filter((r) => r.status === 'PRESENT').length;
  const l = records.filter((r) => r.status === 'LATE').length;
  const a = records.filter((r) => r.status === 'ABSENT').length;
  const lv = records.filter((r) => r.status === 'LEAVE').length;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm">{className.charAt(0)}</div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">{className} — {sectionName}</p>
            <p className="text-[11px] text-gray-400">{records.length} marked</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">{p}P</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">{l}L</span>
          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold">{a}A</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">{lv}Lv</span>
          <svg className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {/* Expanded inline preview + View Details link */}
      {isOpen && (
        <div className="border-t border-gray-100">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50/80">
              <th className="text-left py-2 px-4 text-[11px] font-bold text-gray-500 uppercase">Student</th>
              <th className="text-center py-2 px-4 text-[11px] font-bold text-gray-500 uppercase">Status</th>
              <th className="text-center py-2 px-4 text-[11px] font-bold text-gray-500 uppercase">Check In</th>
            </tr></thead>
            <tbody>{records.map((r) => {
              const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.PRESENT;
              return (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-4">
                    <p className="font-semibold text-gray-900 text-xs">{r.student?.firstName} {r.student?.lastName}</p>
                    <p className="text-[10px] text-gray-400">#{r.student?.rollNumber}</p>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold', st.bg, st.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-center text-xs text-gray-500 tabular-nums">
                    {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
          {/* View Details Link */}
          <div className="p-3 border-t border-gray-50 bg-gray-50/30">
            <Link href={detailPath}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-[11px] font-semibold hover:bg-primary-100 transition">
              View Full Details
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
