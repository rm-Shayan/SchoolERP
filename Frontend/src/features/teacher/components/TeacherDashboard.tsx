'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  teachingAssignmentService,
  timetableService,
  ptmService,
  homeworkService,
} from '@/lib/api';
import type { TimetableSlot } from '@/lib/api/timetableService';
import type { PTMEvent } from '@/lib/api/ptmService';
import type { Homework } from '@/lib/api/homeworkService';
import { PageHeader, Card, CardContent, ListSkeleton } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import DashboardStats from './parts/DashboardStats';
import TodayTimetable from './parts/TodayTimetable';
import UpcomingPtms from './parts/UpcomingPtms';
import RecentHomework from './parts/RecentHomework';

export default function TeacherDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const school = useAppSelector((s) => s.auth.school);
  const schoolId = school?.id ?? user?.schoolId;
  // Use primitive IDs as effect deps — avoids re-fetch when user object ref changes
  const userId = user?.id;

  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [ptmSessions, setPtms] = useState<PTMEvent[]>([]);
  const [homeworkItems, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!schoolId || !userId) return;
    setLoading(true);
    try {
      const [assigns, slots, ptms, hw] = await Promise.allSettled([
        teachingAssignmentService.listMine(schoolId),
        timetableService.getByTeacher(userId),
        ptmService.getBySchool(schoolId),
        homeworkService.getAll({ pageSize: 10 }),
      ]);

      if (assigns.status === 'fulfilled') setAssignments(assigns.value);
      if (slots.status === 'fulfilled') setTimetable(slots.value);
      if (ptms.status === 'fulfilled') setPtms(ptms.value);
      if (hw.status === 'fulfilled') setHomework(hw.value.items);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  // Primitive deps only — no object references
  }, [schoolId, userId]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh([
    'assignment_updated', 'timetable_slot_created', 'timetable_slot_updated',
    'timetable_slot_deleted', 'ptm_created', 'ptm_updated', 'ptm_deleted',
  ], load);

  const jsDay = new Date().getDay();
  const todayDow = jsDay === 0 ? 7 : jsDay;
  const todayClasses = timetable.filter((s) => s.dayOfWeek === todayDow).length;

  const myPtms = ptmSessions.filter(
    (s) => s.teachers?.some((t) => t.id === userId) || s.scope === 'WHOLE_SCHOOL',
  );
  const upcomingCount = myPtms.filter(
    (s) => new Date(s.scheduledAt) >= new Date() && s.status !== 'CANCELLED',
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? 'Teacher'}`}
        description="Here's your teaching overview for today."
      />

      <DashboardStats
        assignmentsCount={assignments.length}
        timetableCount={todayClasses}
        upcomingPtms={upcomingCount}
        recentHomework={homeworkItems.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {loading ? (
          <Card><CardContent><ListSkeleton count={4} /></CardContent></Card>
        ) : (
          <>
            <TodayTimetable slots={timetable} />
            <UpcomingPtms sessions={myPtms} />
          </>
        )}
      </div>

      {loading ? (
        <Card><CardContent><ListSkeleton count={3} /></CardContent></Card>
      ) : (
        <RecentHomework items={homeworkItems} />
      )}
    </div>
  );
}
