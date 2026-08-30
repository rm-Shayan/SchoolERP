'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { timetableService, teachingAssignmentService, academicService } from '@/lib/api';
import type { TimetableSlot } from '@/lib/api/timetableService';
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

  const [mySlots, setMySlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionSlots, setSectionSlots] = useState<Map<string, TimetableSlot[]>>(new Map());
  const [sectionLabels, setSectionLabels] = useState<Map<string, string>>(new Map());
  const [sectionLoading, setSectionLoading] = useState(false);
  const [schoolSlots, setSchoolSlots] = useState<Map<string, TimetableSlot[]>>(new Map());
  const [schoolLabels, setSchoolLabels] = useState<Map<string, string>>(new Map());
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<ViewMode>('my');
  const sectionsLoaded = useRef(false);
  const schoolLoaded = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try { setMySlots(await timetableService.getByTeacher(userId)); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['timetable_slot_created', 'timetable_slot_updated', 'timetable_slot_deleted', 'timetable_cleared'], load);

  const loadSections = useCallback(async () => {
    if (!schoolId || !userId || sectionsLoaded.current) return;
    sectionsLoaded.current = true;
    setSectionLoading(true);
    try {
      const assigns = await teachingAssignmentService.listMine(schoolId);
      const ids = [...new Set(assigns.filter((a) => a.sectionId).map((a) => a.sectionId!))];
      const labels = new Map<string, string>();
      assigns.forEach((a) => { if (a.sectionId) labels.set(a.sectionId, `${a.class?.name ?? ''} — ${a.section?.name ?? ''}`); });
      const map = new Map<string, TimetableSlot[]>();
      await Promise.all(ids.map(async (sid) => { try { map.set(sid, await timetableService.getBySection(sid)); } catch {} }));
      setSectionSlots(map); setSectionLabels(labels);
    } catch { toast.error('Failed to load sections'); }
    finally { setSectionLoading(false); }
  }, [schoolId, userId]);

  const loadSchool = useCallback(async () => {
    if (!schoolId || schoolLoaded.current) return;
    schoolLoaded.current = true;
    setSchoolLoading(true);
    try {
      const classes = await academicService.getClassesBySchool(schoolId);
      const map = new Map<string, TimetableSlot[]>();
      const labels = new Map<string, string>();
      const ids: string[] = [];
      for (const c of classes) (c.sections ?? []).forEach((s) => { ids.push(s.id); labels.set(s.id, `${c.name} — ${s.name}`); });
      await Promise.all(ids.map(async (sid) => { try { map.set(sid, await timetableService.getBySection(sid)); } catch {} }));
      setSchoolSlots(map); setSchoolLabels(labels);
    } catch { toast.error('Failed to load school timetable'); }
    finally { setSchoolLoading(false); }
  }, [schoolId]);

  useEffect(() => {
    if (view === 'sections') loadSections();
    else if (view === 'school') loadSchool();
  }, [view, loadSections, loadSchool]);

  const todayDow = (() => { const d = new Date().getDay(); return d === 0 ? 7 : d; })();
  const highlightDow = weekOffset === 0 ? todayDow : -1;
  const { label: weekLabel, dates } = useMemo(() => getWeekInfo(weekOffset), [weekOffset]);
  const timeRows = useMemo(() => {
    const map = new Map<string, { start: string; end: string }>();
    mySlots.forEach((s) => { const k = `${s.startTime}-${s.endTime}`; if (!map.has(k)) map.set(k, { start: s.startTime, end: s.endTime }); });
    return Array.from(map.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [mySlots]);
  const grid = useMemo(() => {
    const g = new Map<string, TimetableSlot>();
    mySlots.forEach((s) => g.set(`${s.startTime}-${s.endTime}-${s.dayOfWeek}`, s));
    return g;
  }, [mySlots]);

  const tabBtn = (k: ViewMode, label: string, count: number) => (
    <button key={k} onClick={() => setView(k)}
      className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        view === k ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50')}>
      {label}{count > 0 && <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{count}</span>}
    </button>
  );

  const renderSections = (map: Map<string, TimetableSlot[]>, lbls: Map<string, string>, isLoading: boolean) =>
    isLoading ? <Card><CardContent><TableSkeleton rows={3} cols={7} /></CardContent></Card>
      : map.size === 0 ? <Card><EmptyState title="No timetables" /></Card>
      : <div className="space-y-4">{[...map.entries()].map(([id, s]) => <SectionTimetableOverview key={id} slots={s} sectionLabel={lbls.get(id) ?? id} />)}</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="My Timetable" description="Your weekly teaching schedule."
        actions={mySlots.length > 0 && userId ? <Button size="sm" variant="outline" onClick={() => timetableService.downloadTeacherPdf(userId).catch(() => toast.error('Download failed'))}>Download PDF</Button> : undefined} />

      {!loading && (mySlots.length > 0 || sectionSlots.size > 0) && (
        <div className="flex gap-2">{tabBtn('my', 'My Schedule', 1)}{tabBtn('sections', 'My Sections', sectionSlots.size)}{tabBtn('school', 'School Overview', schoolSlots.size)}</div>
      )}

      {view === 'my' && !loading && mySlots.length > 0 && (
        <WeekNav weekLabel={weekLabel} weekOffset={weekOffset} onPrev={() => setWeekOffset((w) => w - 1)} onNext={() => setWeekOffset((w) => w + 1)} onBackToToday={() => setWeekOffset(0)} />
      )}

      {loading ? <Card><CardContent><TableSkeleton rows={5} cols={7} /></CardContent></Card>
        : view === 'my' ? mySlots.length === 0 ? <Card><EmptyState title="No timetable assigned" description="Your timetable will appear here once assigned." /></Card>
        : <>
          <Card className="hidden md:block"><CardContent className="p-0 overflow-x-auto"><DesktopTimetableGrid timeRows={timeRows} grid={grid} dates={dates} highlightDow={highlightDow} /></CardContent></Card>
          <MobileTimetableCards slots={mySlots} highlightDow={highlightDow} dates={dates} />
        </>
        : view === 'sections' ? renderSections(sectionSlots, sectionLabels, sectionLoading)
        : renderSections(schoolSlots, schoolLabels, schoolLoading)}
    </div>
  );
}
