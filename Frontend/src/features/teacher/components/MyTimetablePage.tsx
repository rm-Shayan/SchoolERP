'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { timetableService } from '@/lib/api';
import type { TimetableSlot } from '@/lib/api/timetableService';
import { PageHeader, Card, CardContent, EmptyState, TableSkeleton } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MyTimetablePage() {
  const { user } = useAppSelector((s) => s.auth);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setSlots(await timetableService.getByTeacher(user.id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['timetable_slot_created', 'timetable_slot_updated', 'timetable_slot_deleted', 'timetable_cleared'], load);

  const maxPeriod = slots.reduce((m, s) => Math.max(m, s.periodNumber ?? 0), 0);
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <PageHeader title="My Timetable" description="Your weekly teaching schedule." />

      {loading ? (
        <Card><CardContent><TableSkeleton rows={5} cols={7} /></CardContent></Card>
      ) : slots.length === 0 ? (
        <Card><EmptyState title="No timetable assigned" description="Your timetable will appear here once assigned." /></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  {DAYS.map((d) => (
                    <th key={d} className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periods.map((period) => (
                  <tr key={period}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">Period {period}</td>
                    {DAYS.map((_, dayIdx) => {
                      const slot = slots.find((s) => s.dayOfWeek === dayIdx && s.periodNumber === period);
                      return (
                        <td key={dayIdx} className="px-4 py-3">
                          {slot ? (
                            <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
                              <p className="text-sm font-medium text-primary-800">{slot.subject?.name ?? `Subject: ${slot.subjectId}`}</p>
                              <p className="text-xs text-primary-600">{slot.startTime} - {slot.endTime}</p>
                              {slot.roomNumber && <p className="text-xs text-primary-500">Room {slot.roomNumber}</p>}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
