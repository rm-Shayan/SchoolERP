'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService, promotionService, studentService } from '@/lib/api';
import type { AcademicYear, Class, Student } from '@/types';
import { Button, Card, ConfirmDialog, EmptyState, Select } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { PromotionHistory } from './parts/PromotionHistory';
import { StudentChecklist } from './parts/StudentChecklist';
import PromotionHero from './parts/PromotionHero';

const classOptions = (classes: Class[]) => classes.map((c) => ({ value: c.id, label: c.name }));
const yearOptions = (years: AcademicYear[]) => years.map((y) => ({ value: y.id, label: y.name }));
const sectionOptions = (sections: { id: string; name: string; _count?: { students: number } }[]) =>
  sections.map((s) => ({ value: s.id, label: (s._count?.students ?? 0) > 0 ? `${s.name} (${s._count?.students})` : s.name }));

type GradAction = 'graduate' | 'dropout' | null;

export default function PromotionsPage() {
  const { school, user } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [yearId, setYearId] = useState('');
  const [fromClassId, setFromClassId] = useState('');
  const [fromSectionId, setFromSectionId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [metaLoading, setMetaLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [gradAction, setGradAction] = useState<GradAction>(null);
  const [gradRemarks, setGradRemarks] = useState('');
  const [gradBusy, setGradBusy] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      academicService.getYearsBySchool(schoolId).then(setYears),
      academicService.getClassesBySchool(schoolId).then((data) => setClasses(data.map((c) => ({ ...c, sections: c.sections ?? [] })))),
    ]).catch(() => toast.error('Failed to load years/classes')).finally(() => setMetaLoading(false));
  }, [schoolId]);

  const sortedClasses = useMemo(() => [...classes].sort((a, b) => a.order - b.order), [classes]);
  const fromSections = useMemo(() => classes.find((c) => c.id === fromClassId)?.sections ?? [], [classes, fromClassId]);
  const toSections = useMemo(() => classes.find((c) => c.id === toClassId)?.sections ?? [], [classes, toClassId]);

  // Detect last class
  const lastClassIds = useMemo(() => {
    const maxOrder = sortedClasses.reduce((max, c) => Math.max(max, c.order), -1);
    return new Set(sortedClasses.filter((c) => c.order === maxOrder).map((c) => c.id));
  }, [sortedClasses]);
  const isLastClass = fromClassId ? lastClassIds.has(fromClassId) : false;

  const ready = isLastClass ? !!yearId && !!fromSectionId : !!yearId && !!fromSectionId && !!toSectionId;

  useEffect(() => {
    const sections = classes.find((c) => c.id === fromClassId)?.sections ?? [];
    setFromSectionId(sections.find((s) => (s._count?.students ?? 0) > 0)?.id ?? sections[0]?.id ?? '');
    if (!isLastClass) { setToClassId(''); setToSectionId(''); }
  }, [fromClassId, classes, isLastClass]);
  useEffect(() => { setToSectionId(''); }, [toClassId]);

  const loadStudents = useCallback(async () => {
    if (!schoolId || !fromSectionId) { setStudents([]); setSelected(new Set()); return; }
    setLoading(true);
    try {
      const first = await studentService.getPage({ schoolId, sectionId: fromSectionId, status: 'ACTIVE', page: 1, pageSize: 100 });
      const totalPages = Math.min(10, Math.max(1, Math.ceil(first.total / 100)));
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          studentService.getPage({ schoolId, sectionId: fromSectionId, status: 'ACTIVE', page: i + 2, pageSize: 100 }))
      );
      setStudents([...first.items, ...rest.flatMap((r) => r.items)]);
      setSelected(new Set());
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [schoolId, fromSectionId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const toggle = useCallback((id: string) =>
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }), []);
  const toggleAll = useCallback(() =>
    setSelected(students.length && selected.size === students.length ? new Set() : new Set(students.map((s) => s.id))),
  [students, selected]);

  // Promote
  const handlePromote = async (ids?: Set<string>) => {
    if (!ready || (ids && !ids.size)) return;
    setPromoting(true);
    try {
      const res = await promotionService.bulkPromote({ academicYearId: yearId, fromSectionId, toSectionId, studentIds: ids ? [...ids] : undefined });
      toast.success(`${res.promoted} students promoted`);
      setHistoryKey((k) => k + 1);
      loadStudents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Promotion failed');
    } finally { setPromoting(false); }
  };

  // Graduate / Dropout
  const handleGradAction = async () => {
    if (!yearId || !fromSectionId || !gradAction) return;
    setGradBusy(true);
    try {
      const studentIds = selected.size > 0 ? [...selected] : undefined;
      if (gradAction === 'graduate') {
        const res = await promotionService.bulkGraduate({ academicYearId: yearId, sectionId: fromSectionId, studentIds, remarks: gradRemarks || undefined });
        toast.success(`${res.graduated} students graduated`);
      } else {
        const res = await promotionService.bulkDropout({ academicYearId: yearId, sectionId: fromSectionId, studentIds, remarks: gradRemarks || undefined });
        toast.success(`${res.droppedOut} students marked as dropped out`);
      }
      setHistoryKey((k) => k + 1);
      setGradAction(null);
      setGradRemarks('');
      loadStudents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Action failed');
    } finally { setGradBusy(false); }
  };

  const gradLabel = gradAction === 'graduate' ? 'Graduate' : 'Drop Out';
  const gradDesc = gradAction === 'graduate'
    ? `This will graduate ${selected.size > 0 ? selected.size : students.length} student(s) from this section. Their records will be archived and photos moved to cold storage. This action creates a PromotionRecord for history tracking.`
    : `This will mark ${selected.size > 0 ? selected.size : students.length} student(s) as dropped out. Their records will be archived. This action creates a PromotionRecord for history tracking.`;

  return (
    <div className="space-y-6">
      <PromotionHero />

      {/* Setup */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">1 · {isLastClass ? 'Graduation Setup' : 'Promotion Setup'}</h3>
        </div>
        <div className="p-5">
          <div className={`grid gap-4 sm:grid-cols-2 ${isLastClass ? 'lg:grid-cols-3' : 'lg:grid-cols-5'}`}>
            <Select label="Target Academic Year" placeholder="Select year" loading={metaLoading} options={yearOptions(years)} value={yearId} onChange={(e) => setYearId(e.target.value)} />
            <Select label="From Class" placeholder="Current class" loading={metaLoading} options={classOptions(sortedClasses)} value={fromClassId} onChange={(e) => setFromClassId(e.target.value)} />
            <Select label="From Section" placeholder="Current section" loading={metaLoading || !fromClassId} options={sectionOptions(fromSections)} value={fromSectionId} onChange={(e) => setFromSectionId(e.target.value)} />
            {!isLastClass && (
              <>
                <Select label="To Class" placeholder="Next class" loading={metaLoading} options={classOptions(sortedClasses)} value={toClassId} onChange={(e) => setToClassId(e.target.value)} />
                <Select label="To Section" placeholder="Next section" loading={metaLoading || !toClassId} options={sectionOptions(toSections)} value={toSectionId} onChange={(e) => setToSectionId(e.target.value)} />
              </>
            )}
          </div>
          {isLastClass ? (
            <p className="mt-3 text-xs text-amber-600 font-medium">This is the school's final class. Students here will be graduated (passed out) instead of promoted.</p>
          ) : (
            <p className="mt-3 text-xs text-gray-500">Create the target year in Academic Setup first. Leave repeaters unchecked in the list.</p>
          )}
        </div>
      </Card>

      {/* Students */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            2 · {isLastClass ? 'Students to Graduate' : 'Students to Promote'}
            <span className="ml-1 inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">{selected.size}/{students.length} selected</span>
          </h3>
          {students.length > 0 && (
            <button onClick={toggleAll} className="text-sm font-medium text-primary-600 hover:text-primary-700">{selected.size === students.length ? 'Unselect all' : 'Select all'}</button>
          )}
        </div>

        {loading ? (
          <div className="p-5 space-y-2 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <div className="w-5 h-5 bg-gray-200 rounded shrink-0" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            title={fromSectionId ? 'No active students in this section' : 'Select a source section'}
            description={fromSectionId ? 'This section has no ACTIVE students.' : 'Select a source class + section.'}
          />
        ) : (
          <StudentChecklist students={students} selected={selected} onToggle={toggle} />
        )}

        <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/40 px-5 py-3">
          {isLastClass ? (
            <>
              <Button disabled={!ready || !students.length} loading={gradBusy} onClick={() => setGradAction('graduate')}>
                Graduate All ({students.length})
              </Button>
              <Button variant="outline" disabled={!ready || !selected.size} loading={gradBusy} onClick={() => setGradAction('graduate')}>
                Graduate Selected ({selected.size})
              </Button>
              <div className="w-px bg-gray-200 mx-1" />
              <Button variant="danger" disabled={!ready || !students.length} loading={gradBusy} onClick={() => setGradAction('dropout')}>
                Drop Out All ({students.length})
              </Button>
            </>
          ) : (
            <>
              <Button disabled={!ready || !students.length} loading={promoting} onClick={() => handlePromote()}>Promote All ({students.length})</Button>
              <Button variant="outline" disabled={!ready || !selected.size || selected.size === students.length} loading={promoting} onClick={() => handlePromote(selected)}>Promote Selected ({selected.size})</Button>
            </>
          )}
        </div>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!gradAction}
        title={`${gradLabel} ${selected.size > 0 ? selected.size : students.length} students?`}
        message={gradDesc}
        confirmLabel={gradLabel}
        variant={gradAction === 'dropout' ? 'danger' : 'primary'}
        loading={gradBusy}
        onConfirm={handleGradAction}
        onCancel={() => { setGradAction(null); setGradRemarks(''); }}
      />

      <PromotionHistory schoolId={schoolId} refreshKey={historyKey} />
    </div>
  );
}
