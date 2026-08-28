'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Button, Select, EmptyState, TableSkeleton } from '@/features/shared/components';
import { studentService } from '@/lib/api';
import { academicService, type Class, type Subject } from '@/lib/api/academicService';
import type { TeachingAssignment } from '@/lib/api/teachingAssignmentService';
import type { Student } from '@/types';
import ResultGrid from './ResultGrid';
import ResultCardModal from './ResultCardModal';
import ResultActionsBar from './ResultActionsBar';
import { useResultsSaving } from './useResultsSaving';
import toast from 'react-hot-toast';

interface Props {
  schoolId: string;
  examId: string;
  examName: string;
  assignments: TeachingAssignment[];
  onBack: () => void;
}

interface Coverage {
  classId: string;
  sectionId: string | null;
  subjectId: string | null;
  label: string;
}

export default function TeacherResultsWorkspace({ schoolId, examId, examName, assignments, onBack }: Props) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [coverage, setCoverage] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [cardStudent, setCardStudent] = useState<Student | null>(null);
  const { values, saving, handleCell, saveResults, resetValues } = useResultsSaving(examId);

  const options = useMemo<Coverage[]>(() => {
    const classMap = new Map(classes.map((c) => [c.id, c]));
    return assignments.map((a) => {
      const cls = classMap.get(a.classId);
      const label = `${cls?.name ?? 'Class'}${a.section ? ` — ${a.section.name}` : ' (all sections)'}${a.subject ? ` · ${a.subject.name}` : ' · all subjects'}`;
      return { classId: a.classId, sectionId: a.sectionId, subjectId: a.subjectId, label };
    });
  }, [assignments, classes]);

  useEffect(() => {
    academicService.getClassesBySchool(schoolId).then(setClasses).catch(() => toast.error('Failed to load classes'));
  }, [schoolId]);

  const loadGrid = useCallback(async () => {
    const sel = options.find((o) => o.label === coverage);
    if (!sel) return;
    setLoading(true);
    try {
      const classObj = classes.find((c) => c.id === sel.classId);
      const sections = sel.sectionId
        ? [sel.sectionId]
        : (classObj?.sections ?? []).map((s) => s.id);
      const [studentData, subjectData] = await Promise.all([
        Promise.all(sections.map((sid) => studentService.getAll({ schoolId, sectionId: sid }))),
        sel.subjectId
          ? Promise.resolve([{ id: sel.subjectId, classId: sel.classId, name: '' }])
          : academicService.getSubjectsByClass(sel.classId),
      ]);
      const merged = [...new Map(studentData.flat().map((s) => [s.id, s])).values()];
      setStudents(merged);
      setSubjects(sel.subjectId ? subjectData.filter((s) => s.id === sel.subjectId) : subjectData);
      resetValues();
    } catch {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [options, coverage, classes, schoolId, resetValues]);

  useEffect(() => { if (coverage) loadGrid(); }, [loadGrid]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{examName}</h3>
          <p className="text-sm text-slate-500">Enter results for your assigned class/section.</p>
        </div>
        <Button variant="ghost" onClick={onBack}>← Exams</Button>
      </div>
      <Card>
        <CardContent className="space-y-4">
          <Select
            label="My Class / Section"
            placeholder="Select an assignment"
            options={options.map((o) => ({ value: o.label, label: o.label }))}
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
          />
          {!coverage && <p className="text-sm text-amber-600">No class has been assigned to you yet.</p>}
        </CardContent>
      </Card>
      {coverage && (
        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={6} cols={4} />
            ) : students.length === 0 ? (
              <EmptyState title="No students found" description="There are no active students in this section." />
            ) : (
              <>
                <ResultGrid students={students} subjects={subjects} values={values} onChange={handleCell} />
                <ResultActionsBar students={students} saving={saving} onSave={saveResults} onPickStudent={setCardStudent} />
              </>
            )}
          </CardContent>
        </Card>
      )}
      <ResultCardModal
        examId={examId}
        student={cardStudent}
        onClose={() => setCardStudent(null)}
      />
    </div>
  );
}