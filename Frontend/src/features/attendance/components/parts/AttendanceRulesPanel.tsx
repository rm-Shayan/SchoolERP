'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { schoolService } from '@/lib/api/schoolService';
import { setActiveSchool } from '@/store/slices/authSlice';
import { Card, CardHeader, CardContent, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Props { schoolId: string; onClose: () => void; }

const SLOTS = [
  { key: 'start', label: 'Scanning Opens', desc: 'QR gate scanning starts', color: 'bg-blue-500', defaultVal: '07:45', field: 'attendanceStartTime' as const },
  { key: 'cutoff', label: 'Late Cutoff', desc: 'Unmarked students → LATE', color: 'bg-amber-500', defaultVal: '08:30', field: 'attendanceCutoffTime' as const },
  { key: 'absent', label: 'Absent Cutoff', desc: 'Still no check-in → ABSENT', color: 'bg-red-500', defaultVal: '10:00', field: 'attendanceAbsentTime' as const },
  { key: 'alert', label: 'Alert Time', desc: 'Parents notified of late/absent', color: 'bg-purple-500', defaultVal: '09:30', field: 'attendanceAlertTime' as const },
];

export default function AttendanceRulesPanel({ schoolId, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { school } = useAppSelector((s) => s.auth);
  const [times, setTimes] = useState({
    attendanceStartTime: school?.attendanceStartTime ?? '07:45',
    attendanceCutoffTime: school?.attendanceCutoffTime ?? '08:30',
    attendanceAbsentTime: school?.attendanceAbsentTime ?? '10:00',
    attendanceAlertTime: school?.attendanceAlertTime ?? '09:30',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await schoolService.update(schoolId, times);
      dispatch(setActiveSchool(updated));
      toast.success('Attendance timing rules saved — cron jobs will use new times');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50/50 to-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-primary-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Attendance Timing Rules</h3>
            <p className="text-[11px] text-gray-500">Set when students are marked late / absent — cron runs every 15 min</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Visual timeline */}
        <div className="relative flex items-center gap-0 px-4">
          {SLOTS.map((slot, i) => (
            <div key={slot.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-full ring-4 ring-white shadow-sm', slot.color)} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {times[slot.field] || slot.defaultVal}
                </span>
              </div>
              {i < SLOTS.length - 1 && (
                <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-200 to-gray-100 mx-1 rounded-full" />
              )}
            </div>
          ))}
        </div>

        {/* Time inputs grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SLOTS.map((slot) => (
            <div key={slot.key} className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full', slot.color)} />
                <label className="text-xs font-bold text-gray-700">{slot.label}</label>
              </div>
              <input
                type="time"
                value={times[slot.field]}
                onChange={(e) => setTimes((p) => ({ ...p, [slot.field]: e.target.value }))}
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-900 bg-gray-50 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white outline-none transition-all"
              />
              <p className="text-[10px] text-gray-400 leading-tight">{slot.desc}</p>
            </div>
          ))}
        </div>

        {/* Save row */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[10px] text-gray-400">Order: Start → Late → Absent → Alert</p>
          <Button size="sm" loading={saving} onClick={handleSave}>Save Timing Rules</Button>
        </div>
      </CardContent>
    </Card>
  );
}
