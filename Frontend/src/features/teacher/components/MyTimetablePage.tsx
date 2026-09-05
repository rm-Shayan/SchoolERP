'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useGetByTeacherQuery, useGetBySectionQuery, useListMineAssignmentsQuery, useClassesBySchoolQuery } from '@/store/api';
import { timetableService } from '@/lib/api';
import { PageHeader, Card, CardContent, EmptyState, TableSkeleton, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { cn } from '@/lib/utils';
import WeekNav from './parts/WeekNav';
import SectionTimetableOverview from './parts/SectionTimetableOverview';
import MobileTimetableCards from './parts/MobileTimetableCards';
import DesktopTimetableGrid from './parts/DesktopTimetableGrid';

type ViewMode = 'my' | 'sections' | 'school';
function getWeekInfo(offset: number) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const label = `${fmt(monday)} – ${fmt(new Date(monday.getTime() + 6 * 86400000))}, ${monday.getFullYear()}`;
  const dates = [1, 2, 3, 4, 5, 6, 7].map((d) => { const dt = new Date(monday); dt.setDate(monday.getDate() + d - 1); return fmt(dt); });
  return { label, dates };
}

export default function MyTimetablePage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const userId = user?.id;

  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<ViewMode>('my');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSchoolSectionId, setSelectedSchoolSectionId] = useState<string | null>(null);

  const { data: mySlots = [], isLoading } = useGetByTeacherQuery(userId!, { skip: !userId });
  const { data: assignments = [] } = useListMineAssignmentsQuery(schoolId!, { skip: !schoolId });
  const { data: classes = [] } = useClassesBySchoolQuery(schoolId!, { skip: !schoolId || view !== 'school' });

  const mySectionIds = useMemo(
    () => [...new Set(assignments.filter((a) => a.sectionId).map((a) => a.sectionId!))],
    [assignments],
  );
  const sectionLabels = useMemo(() => {
    const m = new Map<string, string>();
    assignments.forEach((a) => { if (a.sectionId) m.set(a.sectionId, `${a.class?.name ?? ''} — ${a.section?.name ?? ''}`); });
    return m;
  }, [assignments]);

  const schoolSectionIds = useMemo(
    () => classes.flatMap((c) => (c.sections ?? []).map((s) => s.id)),
    [classes],
  );
  const schoolLabels = useMemo(() => {
    const m = new Map<string, string>();
    classes.forEach((c) => (c.sections ?? []).forEach((s) => m.set(s.id, `${c.name} — ${s.name}`)));
    return m;
  }, [classes]);

  const { data: sectionSlots } = useGetBySectionQuery(selectedSectionId!, { skip: !selectedSectionId });
  const { data: schoolSectionSlots } = useGetBySectionQuery(selectedSchoolSectionId!, { skip: !selectedSchoolSectionId });

  const [sectionData, setSectionData] = useState<Map<string, any[]>>(new Map());
  const [schoolData, setSchoolData] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    if (sectionSlots && selectedSectionId) {
      setSectionData((prev) => new Map(prev).set(selectedSectionId, sectionSlots));
    }
  }, [sectionSlots, selectedSectionId]);

  useEffect(() => {
    if (schoolSectionSlots && selectedSchoolSectionId) {
      setSchoolData((prev) => new Map(prev).set(selectedSchoolSectionId, schoolSectionSlots));
    }
  }, [schoolSectionSlots, selectedSchoolSectionId]);

  useRealtimeRefresh(['timetable_slot_created', 'timetable_slot_updated', 'timetable_slot_deleted'], useCallback(() => {}, []));

  const todayDow = (() => { const d = new Date().getDay(); return d === 0 ? 7 : d; })();
  const highlightDow = weekOffset === 0 ? todayDow : -1;
  const { label: weekLabel, dates } = useMemo(() => getWeekInfo(weekOffset), [weekOffset]);
  const timeRows = useMemo(() => {
    const map = new Map<string, { start: string; end: string }>();
    mySlots.forEach((s) => { const k = `${s.startTime}-${s.endTime}`; if (!map.has(k)) map.set(k, { start: s.startTime, end: s.endTime }); });
    return Array.from(map.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [mySlots]);
  const grid = useMemo(() => {
    const g = new Map<string, any>();
    mySlots.forEach((s) => g.set(`${s.startTime}-${s.endTime}-${s.dayOfWeek}`, s));
    return g;
  }, [mySlots]);

  const tabBtn = (k: ViewMode, label: string, count: number) => (
    <button key={k} onClick={() => setView(k)}
      className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-color-colors',
        view === k ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50')}>
      {label}{count > 0 && <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{count}</span>}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="My Timetable" description="Your weekly teaching schedule."
        actions={mySlots.length > 0 && userId ? <Button size="sm" variant="outline" onClick={() => timetableService.downloadTeacherPdf(userId).catch(() => toast.error('Download failed'))}>Download PDF</Button> : undefined} />
      {!isLoading && (mySlots.length > 0 || sectionData.size > 0) && (
        <div className="flex gap-2">{tabBtn('my', 'My Schedule', 1)}{tabBtn('sections', 'My Sections', mySectionIds.length)}{tabBtn('school', 'School Overview', schoolSectionIds.length)}</div>
      )}
      {view === 'my' && !isLoading && mySlots.length > 0 && (
        <WeekNav weekLabel={weekLabel} weekOffset={weekOffset} onPrev={() => setWeekOffset((w) => w - 1)} onNext={() => setWeekOffset((w) => w + 1)} onBackToToday={() => setWeekOffset(0)} />
      )}
      {isLoading ? <Card><CardContent><TableSkeleton rows={5} cols={7} /></CardContent></Card>
        : view === 'my' ? mySlots.length === 0 ? <Card><EmptyState title="No timetable assigned" description="Your timetable will appear here once assigned." /></Card>
        : <>
          <Card className="hidden md:block"><CardContent className="p-0 overflow-x-auto"><DesktopTimetableGrid timeRows={timeRows} grid={grid} dates={dates} highlightDow={highlightDow} /></CardContent></Card>
          <MobileTimetableCards slots={mySlots} highlightDow={highlightDow} dates={dates} />
          </>
        : view === 'sections' ? (
          <div className="space-y-4">
            {mySectionIds.map((id) => (
              <button key={id} onClick={() => setSelectedSectionId(id)} className="block w-full text-left">
                {sectionData.has(id) ? (
                  <SectionTimetableOverview slots={sectionData.get(id)!} sectionLabel={sectionLabels.get(id) ?? id} />
                ) : selectedSectionId === id ? (
                  <Card><CardContent><TableSkeleton rows={3} cols={7} /></CardContent></Card>
                ) : (
                  <Card><CardContent className="p-4 text-sm text-gray-500">{sectionLabels.get(id) ?? id} — Click to load</CardContent></Card>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {schoolSectionIds.map((id) => (
              <button key={id} onClick={() => setSelectedSchoolSectionId(id)} className="block w-full text-left">
                {schoolData.has(id) ? (
                  <SectionTimetableOverview slots={schoolData.get(id)!} sectionLabel={schoolLabels.get(id) ?? id} />
                ) : selectedSchoolSectionId === id ? (
                  <Card><CardContent><TableSkeleton rows={3} cols={7} /></CardContent></Card>
                ) : (
                  <Card><CardContent className="p-4 text-sm text-gray-500">{schoolLabels.get(id) ?? id} — Click to load</CardContent></Card>
                )}
              </button>
            ))}
          </div>
        )}
    </div>
  );
}
