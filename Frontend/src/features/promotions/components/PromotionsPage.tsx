'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { academicService, promotionService, studentService } from '@/lib/api';
import type { AcademicYear, Class, Student } from '@/types';
import { Card, ConfirmDialog, EmptyState, Select } from '@/features/shared/components';
import toast from 'react-hot-toast';
import { PromotionHistory } from './parts/PromotionHistory';
import { StudentChecklist } from './parts/StudentChecklist';
import PromotionHero from './parts/PromotionHero';
import PromotionActions from './parts/PromotionActions';
const classOpts = (c: Class[]) => c.map((x) => ({ value: x.id, label: x.name }));
const yearOpts = (y: AcademicYear[]) => y.map((x) => ({ value: x.id, label: x.name }));
const sectionOpts = (s: { id: string; name: string; _count?: { students: number } }[]) =>
  s.map((x) => ({ value: x.id, label: (x._count?.students ?? 0) > 0 ? `${x.name} (${x._count?.students})` : x.name }));
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
      academicService.getClassesBySchool(schoolId).then((d) => setClasses(d.map((c) => ({ ...c, sections: c.sections ?? [] })))),
    ]).catch(() => toast.error('Failed to load years/classes')).finally(() => setMetaLoading(false));
  }, [schoolId]);

  const sorted = useMemo(() => [...classes].sort((a, b) => a.order - b.order), [classes]);
  const fromSections = useMemo(() => classes.find((c) => c.id === fromClassId)?.sections ?? [], [classes, fromClassId]);
  const toSections = useMemo(() => classes.find((c) => c.id === toClassId)?.sections ?? [], [classes, toClassId]);
  const lastClassIds = useMemo(() => {
    const max = sorted.reduce((m, c) => Math.max(m, c.order), -1);
    return new Set(sorted.filter((c) => c.order === max).map((c) => c.id));
  }, [sorted]);
  const isLastClass = fromClassId ? lastClassIds.has(fromClassId) : false;
  const ready = isLastClass ? !!yearId && !!fromSectionId : !!yearId && !!fromSectionId && !!toSectionId;

  useEffect(() => {
    const secs = classes.find((c) => c.id === fromClassId)?.sections ?? [];
    setFromSectionId(secs.find((s) => (s._count?.students ?? 0) > 0)?.id ?? secs[0]?.id ?? '');
    if (!isLastClass) { setToClassId(''); setToSectionId(''); }
  }, [fromClassId, classes, isLastClass]);
  useEffect(() => { setToSectionId(''); }, [toClassId]);

  const loadStudents = useCallback(async () => {
    if (!schoolId || !fromSectionId) { setStudents([]); setSelected(new Set()); return; }
    setLoading(true);
    try {
      const first = await studentService.getPage({ schoolId, sectionId: fromSectionId, status: 'ACTIVE', page: 1, pageSize: 100 });
      const pages = Math.min(10, Math.max(1, Math.ceil(first.total / 100)));
      const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) =>
        studentService.getPage({ schoolId, sectionId: fromSectionId, status: 'ACTIVE', page: i + 2, pageSize: 100 })));
      setStudents([...first.items, ...rest.flatMap((r) => r.items)]);
      setSelected(new Set());
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [schoolId, fromSectionId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const toggle = useCallback((id: string) =>
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const toggleAll = useCallback(() =>
    setSelected(students.length && selected.size === students.length ? new Set() : new Set(students.map((s) => s.id))),
  [students, selected]);

  const handlePromote = async (ids?: Set<string>) => {
    if (!ready || (ids && !ids.size)) return;
    setPromoting(true);
    try {
      const res = await promotionService.bulkPromote({ academicYearId: yearId, fromSectionId, toSectionId, studentIds: ids ? [...ids] : undefined });
      toast.success(`${res.promoted} students promoted`);
      setHistoryKey((k) => k + 1); loadStudents();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Promotion failed'); }
    finally { setPromoting(false); }
  };

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
      setHistoryKey((k) => k + 1); setGradAction(null); setGradRemarks(''); loadStudents();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Action failed'); }
    finally { setGradBusy(false); }
  };

  const gradLabel = gradAction === 'graduate' ? 'Graduate' : 'Drop Out';
  const count = selected.size > 0 ? selected.size : students.length;
  const gradDesc = gradAction === 'graduate'
    ? `This will graduate ${count} student(s) from this section.`
    : `This will mark ${count} student(s) as dropped out.`;

  return (
    <div className="space-y-6">
      <PromotionHero />
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">1 · {isLastClass ? 'Graduation Setup' : 'Promotion Setup'}</h3>
        </div>
        <div className="p-5">
          <div className={`grid gap-4 sm:grid-cols-2 ${isLastClass ? 'lg:grid-cols-3' : 'lg:grid-cols-5'}`}>
            <Select label="Target Academic Year" placeholder="Select year" loading={metaLoading} options={yearOpts(years)} value={yearId} onChange={(e) => setYearId(e.target.value)} />
            <Select label="From Class" placeholder="Current class" loading={metaLoading} options={classOpts(sorted)} value={fromClassId} onChange={(e) => setFromClassId(e.target.value)} />
            <Select label="From Section" placeholder="Current section" loading={metaLoading || !fromClassId} options={sectionOpts(fromSections)} value={fromSectionId} onChange={(e) => setFromSectionId(e.target.value)} />
            {!isLastClass && (
              <>
                <Select label="To Class" placeholder="Next class" loading={metaLoading} options={classOpts(sorted)} value={toClassId} onChange={(e) => setToClassId(e.target.value)} />
                <Select label="To Section" placeholder="Next section" loading={metaLoading || !toClassId} options={sectionOpts(toSections)} value={toSectionId} onChange={(e) => setToSectionId(e.target.value)} />
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-500">{isLastClass ? 'Students here will be graduated instead of promoted.' : 'Leave repeaters unchecked in the list.'}</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">2 · {isLastClass ? 'Students to Graduate' : 'Students to Promote'} <span className="ml-1 inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">{selected.size}/{students.length}</span></h3>
          {students.length > 0 && <button onClick={toggleAll} className="text-sm font-medium text-primary-600 hover:text-primary-700">{selected.size === students.length ? 'Unselect all' : 'Select all'}</button>}
        </div>
          {loading ? (
          <div className="p-5 space-y-2 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="flex items-center gap-3 px-4 py-2"><div className="w-5 h-5 bg-gray-200 rounded shrink-0" /><div className="h-3 w-32 bg-gray-200 rounded" /></div>)}</div>
        ) : students.length === 0 ? (
          <EmptyState title={fromSectionId ? 'No active students' : 'Select a source section'} description={fromSectionId ? 'This section has no ACTIVE students.' : 'Select a source class + section.'} />
        ) : (
          <StudentChecklist students={students} selected={selected} onToggle={toggle} />
        )}
        <PromotionActions isLastClass={isLastClass} ready={ready} studentsCount={students.length} selectedCount={selected.size} promoting={promoting} gradBusy={gradBusy} onPromoteAll={() => handlePromote()} onPromoteSelected={() => handlePromote(selected)} onGraduate={() => setGradAction('graduate')} onGraduateSelected={() => setGradAction('graduate')} onDropout={() => setGradAction('dropout')} />
      </Card>

      <ConfirmDialog open={!!gradAction} title={`${gradLabel} ${selected.size > 0 ? selected.size : students.length} students?`} message={gradDesc} confirmLabel={gradLabel} variant={gradAction === 'dropout' ? 'danger' : 'primary'} loading={gradBusy} onConfirm={handleGradAction} onCancel={() => { setGradAction(null); setGradRemarks(''); }} />
      <PromotionHistory schoolId={schoolId} refreshKey={historyKey} />
    </div>
  );
}
