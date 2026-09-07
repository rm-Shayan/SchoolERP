'use client';

import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  useListMineAssignmentsQuery,
  useGetByTeacherQuery,
  usePtmBySchoolQuery,
  useListHomeworkQuery,
} from '@/store/api';
import { PageHeader, Card, CardContent, ListSkeleton } from '@/features/shared/components';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import DashboardStats from './parts/DashboardStats';
import TodayTimetable from './parts/TodayTimetable';
import UpcomingPtms from './parts/UpcomingPtms';
import RecentHomework from './parts/RecentHomework';

export default function TeacherDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const school = useAppSelector((s) => s.auth.school);
  const schoolId = school?.id ?? user?.schoolId;
  const userId = user?.id;

  const { data: assignments = [], isLoading: assignsLoading } = useListMineAssignmentsQuery(schoolId!, { skip: !schoolId });
  const { data: timetable = [], isLoading: ttLoading } = useGetByTeacherQuery(userId!, { skip: !userId });
  const { data: ptmSessions = [], isLoading: ptmLoading } = usePtmBySchoolQuery(schoolId!, { skip: !schoolId });
  const { data: hwData, isLoading: hwLoading } = useListHomeworkQuery({ pageSize: 10 });

  const homeworkItems = useMemo(() => hwData?.items ?? [], [hwData]);
  const loading = assignsLoading || ttLoading || ptmLoading || hwLoading;

  useRealtimeRefresh([
    'assignment_updated', 'timetable_slot_created', 'timetable_slot_updated',
    'timetable_slot_deleted', 'ptm_created', 'ptm_updated', 'ptm_deleted',
  ], useCallback(() => {}, []));

  const jsDay = new Date().getDay();
  const todayDow = jsDay === 0 ? 7 : jsDay;
  const todayClasses = useMemo(() => timetable.filter((s) => s.dayOfWeek === todayDow).length, [timetable, todayDow]);

  const myPtms = useMemo(() => ptmSessions.filter(
    (s) => s.teachers?.some((t) => t.id === userId) || s.scope === 'WHOLE_SCHOOL',
  ), [ptmSessions, userId]);

  const upcomingCount = useMemo(() => myPtms.filter(
    (s) => new Date(s.scheduledAt) >= new Date() && s.status !== 'CANCELLED',
  ).length, [myPtms]);

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
          <Card className="col-span-1"><CardContent><ListSkeleton count={2} /></CardContent></Card>
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
