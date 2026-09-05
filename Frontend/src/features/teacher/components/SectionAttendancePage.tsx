'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { studentService, attendanceService, teachingAssignmentService, academicService } from '@/lib/api';
import type { Student, AttendanceStatus } from '@/types';
import { PageHeader, Card, EmptyState, TableSkeleton } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { fetchSectionOptions, groupSectionOptions, useAttendanceCounts, type SectionOption } from './parts/helpers';
import AttendanceToolbar from './parts/AttendanceToolbar';
import MarkActionsBar from './parts/MarkActionsBar';
import AttendanceTable from './parts/AttendanceTable';
import StudentMonthlyComparison from './parts/StudentMonthlyComparison';

export default function SectionAttendancePage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const role = user?.role;
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [view, setView] = useState<'mark' | 'compare'>('mark');

  // ADMIN/SUPER_ADMIN → school ki saari classes×sections; TEACHER → assigned sections.
  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      setSectionsLoading(true);
      try {
        let opts: SectionOption[];
        if (role === 'TEACHER') {
          const [assignments, allClasses] = await Promise.all([
            teachingAssignmentService.listMine(schoolId),
            academicService.getClassesBySchool(schoolId),
          ]);
          const allowedIds = new Set<string>();
          const wholeClasses = new Set<string>();
          for (const a of assignments) (a.sectionId ? allowedIds.add(a.sectionId) : a.classId ? wholeClasses.add(a.classId) : null);
          opts = [];
          for (const c of allClasses) {
            const whole = wholeClasses.has(c.id);
            (c.sections ?? []).forEach((s) => {
              if (whole || allowedIds.has(s.id)) opts.push({ id: s.id, label: `${c.name} — ${s.name}`, classId: c.id, className: c.name, sectionName: s.name });
            });
          }
        } else {
          opts = await fetchSectionOptions(schoolId);
        }
        setSections(opts);
      } catch { setSections([]); }
      finally { setSectionsLoading(false); }
    })();
  }, [schoolId, role]);

  const classOptions = useMemo(() => groupSectionOptions(sections), [sections]);
  const classSections = useMemo(() => sections.filter((s) => s.classId === classId), [sections, classId]);

  const loadRoster = useCallback(async (sid: string) => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await studentService.getAll({ schoolId, sectionId: sid, status: 'ACTIVE' });
      setStudents(data);
      const init: Record<string, AttendanceStatus> = {};
      data.forEach((s) => (init[s.id] = 'PRESENT'));
      setMarks(init);
      const results = await Promise.allSettled(data.map(async (s) => {
        const records = await attendanceService.getStudentHistory(s.id);
        if (records.length === 0) return [s.id, -1] as const;
        const good = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
        return [s.id, Math.round((good / records.length) * 100)] as const;
      }));
      const pctMap: Record<string, number> = {};
      results.forEach((r) => { if (r.status === 'fulfilled') pctMap[r.value[0]] = r.value[1]; });
      setPercentages(pctMap);
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to load roster'); }
    finally { setLoading(false); }
  }, [schoolId]);

  const handleClassChange = useCallback((id: string) => {
    setClassId(id); setSectionId(''); setStudents([]); setMarks({}); setPercentages({});
  }, []);

  const handleSectionChange = useCallback((id: string) => { setSectionId(id); loadRoster(id); }, [loadRoster]);
  const toggle = useCallback((studentId: string, status: AttendanceStatus) => setMarks((prev) => ({ ...prev, [studentId]: status })), []);

  const save = useCallback(async () => {
    if (!sectionId) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({ studentId: s.id, status: marks[s.id] ?? 'PRESENT' }));
      await attendanceService.markSectionBulk({ sectionId, date, records });
      toast.success('Attendance saved');
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to save attendance'); }
    finally { setSaving(false); }
  }, [sectionId, students, marks, date]);

  const counts = useAttendanceCounts(students, marks);

  return (
    <div className="space-y-6">
      <PageHeader title="Section Attendance" description="Mark attendance for any class & section — P/L/A/LV/HD in one go." />

      <AttendanceToolbar
        classOptions={classOptions} classId={classId} sections={classSections}
        sectionsLoading={sectionsLoading} sectionId={sectionId} date={date} saving={saving}
        onClassChange={handleClassChange} onSectionChange={handleSectionChange}
        onDateChange={setDate} onSave={save}
      />

      {sectionsLoading && <Card><TableSkeleton rows={3} cols={4} /></Card>}

      {!sectionsLoading && classOptions.length === 0 && (
        <Card><EmptyState title="No sections available" description="No class sections are assigned to you yet." /></Card>
      )}

      {students.length > 0 && (
        <div className="flex gap-2">
          <button onClick={() => setView('mark')} className={view === 'mark' ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm' : 'rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50'}>Mark Attendance</button>
          <button onClick={() => setView('compare')} className={view === 'compare' ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm' : 'rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50'}>📊 Monthly Comparison</button>
        </div>
      )}

      {view === 'mark' && students.length > 0 && (
        <MarkActionsBar counts={counts} total={students.length} studentIds={students.map((s) => s.id)} setMarks={setMarks} />
      )}

      {loading ? (
        <Card><TableSkeleton rows={6} cols={4} /></Card>
      ) : !sectionId ? (
        <Card><EmptyState title="Select a class & section" description="Pick a class and section to load students." /></Card>
      ) : students.length === 0 ? (
        <Card><EmptyState title="No students" description="This section has no active students." /></Card>
      ) : view === 'mark' ? (
        <AttendanceTable students={students} marks={marks} percentages={percentages} onToggle={toggle} onBulkSet={setMarks} />
      ) : (
        <StudentMonthlyComparison students={students} />
      )}
    </div>
  );
}
