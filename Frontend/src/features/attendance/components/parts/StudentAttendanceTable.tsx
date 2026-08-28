'use client';

import type { AttendanceRecord } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  LATE: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ABSENT: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  LEAVE: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  MANUAL_OVERRIDE: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
};

type Row = AttendanceRecord & { className?: string; sectionName?: string };

interface Props {
  records: Row[];
  onOverride: (studentId: string, date: string) => void;
  onDelete: (id: string) => void;
}

export default function StudentAttendanceTable({ records, onOverride, onDelete }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            {['Student', 'Class', 'Date', 'Status', 'Check In'].map((h) => (
              <th key={h} className={`${h === 'Check In' ? 'text-center' : 'text-left'} py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider`}>{h}</th>
            ))}
            <th className="text-right py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.PRESENT;
            return (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                <td className="py-3 px-4">
                  <p className="font-semibold text-gray-900 text-xs">{r.student?.firstName} {r.student?.lastName}</p>
                  <p className="text-[10px] text-gray-400">#{r.student?.rollNumber}</p>
                </td>
                <td className="py-3 px-4 text-xs text-gray-500">{r.className} — {r.sectionName}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{new Date(r.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</td>
                <td className="py-3 px-4">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold', st.bg, st.text)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-gray-500 tabular-nums text-center">
                  {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => onOverride(r.studentId, r.date)}
                      className="text-[11px] font-semibold text-primary-600 hover:text-primary-800">Override</button>
                    <button onClick={() => onDelete(r.id)}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
