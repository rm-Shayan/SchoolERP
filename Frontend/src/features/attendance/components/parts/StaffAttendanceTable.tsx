'use client';

import type { StaffDailyReport } from '@/lib/api/staffAttendanceService';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_BTN = [
  { value: 'PRESENT', label: 'P', full: 'Present', ring: 'ring-emerald-400', bg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', active: 'bg-emerald-500 text-white shadow-sm' },
  { value: 'LATE', label: 'L', full: 'Late', ring: 'ring-amber-400', bg: 'bg-amber-50 text-amber-700 hover:bg-amber-100', active: 'bg-amber-500 text-white shadow-sm' },
  { value: 'ABSENT', label: 'A', full: 'Absent', ring: 'ring-red-400', bg: 'bg-red-50 text-red-600 hover:bg-red-100', active: 'bg-red-500 text-white shadow-sm' },
  { value: 'LEAVE', label: 'Lv', full: 'Leave', ring: 'ring-primary-400', bg: 'bg-primary-50 text-primary-600 hover:bg-primary-100', active: 'bg-primary-500 text-white shadow-sm' },
];

interface Props {
  staff: User[];
  report: StaffDailyReport | null;
  attendance: Record<string, string>;
  onMark: (staffId: string, status: string) => void;
  onEdit: (rec: { id: string; staffName: string; status: string; remarks: string }) => void;
  onDelete: (recId: string) => void;
}

export default function StaffAttendanceTable({ staff, report, attendance, onMark, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Staff</th>
            <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
            <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mark</th>
            <th className="text-right py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((m) => {
            const rec = report?.staff.find((s) => s.id === m.id)?.attendance;
            return (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                <td className="py-3 px-4">
                  <p className="font-semibold text-gray-900 text-xs">{m.name}</p>
                  <p className="text-[10px] text-gray-400">{m.email}</p>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">{m.role}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5 justify-center">
                    {STATUS_BTN.map((st) => (
                      <button key={st.value} onClick={() => onMark(m.id, st.value)} title={st.full}
                        className={cn('w-9 h-9 rounded-xl text-xs font-bold border-2 transition-all',
                          attendance[m.id] === st.value ? cn(st.active, 'border-transparent ring-2 ring-offset-1', st.ring) : cn('border-transparent', st.bg))}>
                        {st.label}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                    {rec?.id && (
                      <>
                        <button onClick={() => onEdit({ id: rec.id, staffName: m.name, status: rec.status, remarks: rec.remarks || '' })}
                          className="text-[11px] font-semibold text-primary-600 hover:text-primary-800">Edit</button>
                        <button onClick={() => onDelete(rec.id)}
                          className="text-[11px] font-semibold text-red-400 hover:text-red-600">Delete</button>
                      </>
                    )}
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
