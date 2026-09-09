'use client';

import { cn } from '@/lib/utils';

export interface DailyRow {
  id: string;
  studentId: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  student?: {
    firstName?: string;
    lastName?: string;
    rollNumber?: string;
  } | null;
}

const ST: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  LATE: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  ABSENT: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  LEAVE: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  HALF_DAY: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  MANUAL_OVERRIDE: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
};

const timeCell = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—';

interface Props {
  rows: DailyRow[];
  onOverride: (row: DailyRow) => void;
  onDelete: (id: string) => void;
}

/** Per-student daily attendance table with inline Override / Delete actions. */
export default function SectionDailyTable({ rows, onOverride, onDelete }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Student</th>
            <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Status</th>
            <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Check In</th>
            <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Check Out</th>
            <th className="text-right py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Action</th>
          </tr></thead>
          <tbody>{rows.map((r) => {
            const st = ST[r.status] ?? ST.PRESENT;
            return (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                <td className="py-3 px-4">
                  <p className="font-semibold text-gray-900 text-xs">{r.student?.firstName} {r.student?.lastName}</p>
                  <p className="text-[10px] text-gray-400">#{r.student?.rollNumber}</p>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold', st.bg, st.text)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />{r.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums">{timeCell(r.checkIn)}</td>
                <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums">{timeCell(r.checkOut)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onOverride(r)} className="text-[11px] font-semibold text-primary-600 hover:text-primary-800">Override</button>
                    <button onClick={() => onDelete(r.id)} className="text-[11px] font-semibold text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
