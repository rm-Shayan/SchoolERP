'use client';

import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  useListMineAssignmentsQuery,
  useGetByTeacherQuery,
  usePtmBySchoolQuery,
  useListHomeworkQuery,
} from '@/store/api';
import { Card, CardContent, ListSkeleton } from '@/features/shared/components';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { sidebarColors } from '@/lib/theme';
import DashboardStats from './parts/DashboardStats';
import TodayTimetable from './parts/TodayTimetable';
import UpcomingPtms from './parts/UpcomingPtms';
import RecentHomework from './parts/RecentHomework';

export default function TeacherDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const school = useAppSelector((s) => s.auth.school);
  const organization = useAppSelector((s) => s.auth.organization);
  const schoolId = school?.id ?? user?.schoolId;
  const userId = user?.id;

  const sColors = sidebarColors(organization?.themeColor || null);
  const bannerBg = `linear-gradient(120deg, ${sColors.bg} 0%, ${sColors.bgHover} 50%, ${sColors.bg} 100%)`;

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
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg border" style={{ background: bannerBg, borderColor: sColors.border }}>
        <div className="absolute top-0 right-0 -mt-6 -mr-6 h-32 w-32 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: sColors.activeAccent }}>
          <div className="h-full w-full" />
        </div>
        <div className="relative z-10 flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Welcome, {user?.name?.split(' ')[0] ?? 'Teacher'}</h1>
          <p className="mt-1 text-sm md:text-base font-medium text-white/75 leading-relaxed">Here's your teaching overview for today.</p>
        </div>
      </div>
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
