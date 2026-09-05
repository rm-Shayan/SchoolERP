'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { studentService, teachingAssignmentService, academicService } from '@/lib/api';
import type { Student } from '@/types';
import { PageHeader, Card, TableSkeleton, Input, Select, Pagination } from '@/features/shared/components';
import StudentRosterTable from './parts/StudentRosterTable';

interface SectionOption { id: string; label: string; classId: string }

const PAGE_SIZE = 15;

export default function MyStudentsPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;

  const [sections, setSections] = useState<SectionOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      try {
        const [assignments, allClasses] = await Promise.all([
          teachingAssignmentService.listMine(schoolId),
          academicService.getClassesBySchool(schoolId),
        ]);
        const allowed = new Set<string>();
        const wholeClass = new Set<string>();
        for (const a of assignments) {
          if (a.sectionId) allowed.add(a.sectionId);
          else if (a.classId) wholeClass.add(a.classId);
        }
        const opts: SectionOption[] = [];
        for (const c of allClasses) {
          const isWhole = wholeClass.has(c.id);
          (c.sections ?? []).forEach((s) => {
            if (isWhole || allowed.has(s.id)) opts.push({ id: s.id, label: `${c.name} — ${s.name}`, classId: c.id });
          });
        }
        setSections(opts);
      } catch { setSections([]); }
    })();
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const batches = await Promise.all(
          sections.map((s) => studentService.getAll({ schoolId, sectionId: s.id, status: 'ACTIVE' }))
        );
        if (alive) setStudents(batches.flat());
      } catch { /* keep previous */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [schoolId, sections]);

  useEffect(() => { setPage(1); }, [search, classId, sectionId]);

  const classOptions = useMemo(
    () => Array.from(new Map(sections.map((s) => [s.classId, { value: s.classId, label: s.label.split(' — ')[0] }])).values()),
    [sections]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classId && s.section?.class?.id !== classId) return false;
      if (sectionId && s.sectionId !== sectionId) return false;
      if (!q) return true;
      return `${s.firstName} ${s.lastName} ${s.rollNumber} ${s.identifierCode}`.toLowerCase().includes(q);
    });
  }, [students, search, classId, sectionId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader title="My Students" description="View active students in your assigned classes and sections." />
      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Search" value={search} placeholder="Name, roll, identifier…" onChange={(e) => setSearch(e.target.value)} />
          <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} options={[{ value: '', label: 'All classes' }, ...classOptions]} />
          <Select label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} options={[{ value: '', label: 'All sections' }, ...sections.map((s) => ({ value: s.id, label: s.label }))]} />
          <div className="flex items-end pb-1 text-sm font-semibold text-gray-600">{filtered.length} student{filtered.length === 1 ? '' : 's'}</div>
        </div>
      </Card>
      {loading ? (
        <Card><TableSkeleton rows={8} cols={5} /></Card>
      ) : (
        <>
          <StudentRosterTable students={pageItems} />
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
