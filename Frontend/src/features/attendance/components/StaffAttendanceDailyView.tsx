'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { staffAttendanceService, staffService } from '@/lib/api';
import type { StaffDailyReport } from '@/lib/api/staffAttendanceService';
import type { User } from '@/types';
import { Button, Card, EmptyState } from '@/features/shared/components';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import StaffAttendanceImportModal from '@/features/staff/components/StaffAttendanceImportModal';
import StaffAttendanceEditModal from './StaffAttendanceEditModal';
import { downloadBlob, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const SBTN = [
  { v: 'PRESENT', l: 'P', f: 'Present', r: 'ring-emerald-400', bg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', on: 'bg-emerald-500 text-white shadow-sm' },
  { v: 'LATE', l: 'L', f: 'Late', r: 'ring-amber-400', bg: 'bg-amber-50 text-amber-700 hover:bg-amber-100', on: 'bg-amber-500 text-white shadow-sm' },
  { v: 'ABSENT', l: 'A', f: 'Absent', r: 'ring-red-400', bg: 'bg-red-50 text-red-600 hover:bg-red-100', on: 'bg-red-500 text-white shadow-sm' },
  { v: 'LEAVE', l: 'Lv', f: 'Leave', r: 'ring-blue-400', bg: 'bg-blue-50 text-blue-600 hover:bg-blue-100', on: 'bg-blue-500 text-white shadow-sm' },
  { v: 'HALF_DAY', l: 'HD', f: 'Half Day', r: 'ring-cyan-400', bg: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100', on: 'bg-cyan-500 text-white shadow-sm' },
];
const STAT_DEFS = [
  { key: 'totalStaff', l: 'Total Staff', a: 'bg-gray-400' },
  { key: 'present', l: 'Present', a: 'bg-emerald-500' },
  { key: 'late', l: 'Late', a: 'bg-amber-500' },
  { key: 'absent', l: 'Absent', a: 'bg-red-500' },
  { key: 'leave', l: 'Leave', a: 'bg-blue-500' },
  { key: 'halfDay', l: 'Half Day', a: 'bg-cyan-500' },
  { key: 'unmarked', l: 'Unmarked', a: 'bg-gray-300' },
];

export default function StaffAttendanceDailyView() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [report, setReport] = useState<StaffDailyReport | null>(null);
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [editRec, setEditRec] = useState<{ id: string; staffName: string; status: string; remarks: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rr, sr] = await Promise.all([
        staffAttendanceService.getDailyReport(date),
        staffService.getAll({ schoolId, pageSize: 500 }),
      ]);
      setReport(rr.data.data); setAllStaff(sr.items);
      const ex: Record<string, string> = {};
      rr.data.data.staff.forEach((s) => { if (s.attendance) ex[s.id] = s.attendance.status; });
      setAttendance(ex);
    } catch (err: any) { toast.error(err?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [date, schoolId]);
  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['staff_attendance_marked'], load);
  const staffOnly = useMemo(() => {
    let list = allStaff.filter((s) => s.role !== 'ADMIN' && s.role !== 'SUPER_ADMIN');
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter((s) => s.name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)); }
    return list;
  }, [allStaff, search]);
  const summary = report?.summary;
  const handleSaveAll = async () => {
    const records = Object.entries(attendance).map(([staffId, status]) => ({ staffId, status }));
    if (!records.length) { toast.error('No attendance to mark'); return; }
    setSaving(true);
    try { await staffAttendanceService.bulkMark({ date, records }); toast.success(`Saved for ${records.length} staff`); load(); }
    catch (err: any) { toast.error(err?.message ?? 'Failed'); }
    finally { setSaving(false); }
  };
  const handleExport = async () => {
    try { const res = await staffAttendanceService.exportAttendance(); downloadBlob(res.data, `staff-attendance-${date}.xlsx`); toast.success('Exported'); }
    catch { toast.error('Export failed'); }
  };
  const handleDelete = async (recId: string) => {
    if (!confirm('Delete this record?')) return;
    try { await staffAttendanceService.deleteRecord(recId); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none" />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…"
            className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-xs bg-white focus:ring-2 focus:ring-primary-300 outline-none" />
        </div>
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={handleExport}>Export</Button>
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>Import</Button>
          <Button size="sm" loading={saving} onClick={handleSaveAll} disabled={!Object.keys(attendance).length}>Save All</Button>
        </div>
      </div>
      {summary && <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {STAT_DEFS.map(({ key, l, a }) => (
          <div key={key} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className={cn('absolute top-0 right-0 w-16 h-16 rounded-bl-[3rem] opacity-10', a)} />
            <p className="text-3xl font-extrabold tabular-nums text-gray-900">{summary[key as keyof typeof summary]}</p>
            <p className="text-xs font-medium text-gray-400 mt-1">{l}</p>
          </div>
        ))}
      </div>}
      {loading ? <Card><div className="p-8"><div className="animate-pulse space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div></div></Card>
        : staffOnly.length === 0 ? <Card><EmptyState title="No staff found" description="Add staff to track attendance." /></Card>
        : <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Staff</th>
              <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Role</th>
              <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Mark</th>
              <th className="text-right py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Action</th>
            </tr></thead>
            <tbody>{staffOnly.map((m) => {
              const rec = report?.staff.find((s) => s.id === m.id)?.attendance;
              return (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <td className="py-3 px-4"><p className="font-semibold text-gray-900 text-xs">{m.name}</p><p className="text-[10px] text-gray-400">{m.email}</p></td>
                  <td className="py-3 px-4"><span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">{m.role}</span></td>
                  <td className="py-3 px-4"><div className="flex gap-1.5 justify-center">{SBTN.map((st) => (
                    <button key={st.v} onClick={() => setAttendance((p) => ({ ...p, [m.id]: st.v }))} title={st.f}
                      className={cn('w-9 h-9 rounded-xl text-xs font-bold border-2 transition-all', attendance[m.id] === st.v ? cn(st.on, 'border-transparent ring-2 ring-offset-1', st.r) : cn('border-transparent', st.bg))}>{st.l}</button>
                  ))}</div></td>
                  <td className="py-3 px-4 text-right"><div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                    {rec?.id && <><button onClick={() => setEditRec({ id: rec.id, staffName: m.name, status: rec.status, remarks: rec.remarks || '' })} className="text-[11px] font-semibold text-primary-600 hover:text-primary-800">Edit</button>
                      <button onClick={() => handleDelete(rec.id)} className="text-[11px] font-semibold text-red-400 hover:text-red-600">Delete</button></>}
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>}
      <StaffAttendanceImportModal open={showImport} onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); load(); }} />
      {editRec && <StaffAttendanceEditModal record={editRec} onClose={(saved) => { setEditRec(null); if (saved) load(); }} />}
    </div>
  );
}
