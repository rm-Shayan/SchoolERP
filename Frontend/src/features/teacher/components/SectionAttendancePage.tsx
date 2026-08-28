'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { studentService, attendanceService } from '@/lib/api';
import type { Student, AttendanceStatus } from '@/types';
import { PageHeader, Card, EmptyState, TableSkeleton } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { fetchSectionOptions, useAttendanceCounts, type SectionOption } from './parts/helpers';
import AttendanceToolbar from './parts/AttendanceToolbar';
import AttendanceSummary from './parts/AttendanceSummary';
import AttendanceTable from './parts/AttendanceTable';

export default function SectionAttendancePage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      try {
        setSections(await fetchSectionOptions(schoolId));
      } catch {
        setSections([]);
      } finally {
        setSectionsLoading(false);
      }
    })();
  }, [schoolId]);

  const loadRoster = useCallback(async (sid: string) => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await studentService.getAll({ schoolId, sectionId: sid, status: 'ACTIVE' });
      setStudents(data);
      const init: Record<string, AttendanceStatus> = {};
      data.forEach((s) => (init[s.id] = 'PRESENT'));
      setMarks(init);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const handleSectionChange = useCallback((id: string) => {
    setSectionId(id);
    loadRoster(id);
  }, [loadRoster]);

  const toggle = useCallback((studentId: string, status: AttendanceStatus) => {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
  }, []);

  const save = useCallback(async () => {
    if (!sectionId) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({ studentId: s.id, status: marks[s.id] ?? 'PRESENT' }));
      await attendanceService.markSectionBulk({ sectionId, date, records });
      toast.success('Attendance saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }, [sectionId, students, marks, date]);

  const counts = useAttendanceCounts(students, marks);

  return (
    <div className="space-y-6">
      <PageHeader title="Section Attendance" description="Mark bulk attendance for your section in under a minute." />

      <AttendanceToolbar
        sections={sections}
        sectionsLoading={sectionsLoading}
        sectionId={sectionId}
        date={date}
        saving={saving}
        onSectionChange={handleSectionChange}
        onDateChange={setDate}
        onSave={save}
      />

      <AttendanceSummary counts={counts} />

      {loading ? (
        <Card><TableSkeleton rows={6} cols={4} /></Card>
      ) : !sectionId ? (
        <Card><EmptyState title="Select a section" description="Pick a class and section to mark attendance." /></Card>
      ) : students.length === 0 ? (
        <Card><EmptyState title="No students" description="This section has no active students." /></Card>
      ) : (
        <AttendanceTable students={students} marks={marks} onToggle={toggle} />
      )}
    </div>
  );
}
