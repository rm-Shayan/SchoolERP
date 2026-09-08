'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { PageHeader, Card, CardContent, Select } from '@/features/shared/components';
import { examService } from '@/lib/api';
import { studentService } from '@/lib/api';
import { academicService, type Subject } from '@/lib/api/academicService';
import type { AcademicYear, Exam, Student } from '@/types';
import ResultsWorkspace from './parts/ResultsWorkspace';
import ResultCardPicker from './parts/ResultCardPicker';
import toast from 'react-hot-toast';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface ClassOption {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

export default function ExamResultsPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const { role } = useRoleAccess();
  const isReadOnly = role === 'RECEPTIONIST';
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [examId, setExamId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const sectionOptions = classes.flatMap((c) =>
    c.sections.map((s) => ({ value: s.id, label: `${c.name} — ${s.name}` }))
  );

  const loadMeta = useCallback(async () => {
    if (!schoolId) return;
    setMetaLoading(true);
    try {
      const [yearData, classData] = await Promise.all([
        academicService.getYearsBySchool(schoolId),
        academicService.getClassesBySchool(schoolId),
      ]);
      setYears(yearData);
      const current = yearData.find((y) => y.isCurrent) ?? yearData[0];
      setYearId((prev) => (prev && yearData.some((y) => y.id === prev) ? prev : current?.id ?? ''));
      setClasses(classData.map((c) => ({ id: c.id, name: c.name, sections: c.sections ?? [] })));
    } catch {
      toast.error('Failed to load data');
    } finally {
      setMetaLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const loadExams = useCallback(async () => {
    if (!schoolId || !yearId) return;
    setExamsLoading(true);
    try {
      const data = await examService.getBySchool(schoolId, yearId);
      setExams(data);
      setExamId((prev) => (prev && data.some((e) => e.id === prev) ? prev : ''));
    } catch {
      toast.error('Failed to load exams');
    } finally {
      setExamsLoading(false);
    }
  }, [schoolId, yearId]);

  useEffect(() => { loadExams(); }, [loadExams]);

  const loadGrid = useCallback(async () => {
    if (!schoolId || !sectionId) return;
    setLoading(true);
    try {
      const selectedClass = classes.find((c) => c.sections.some((s) => s.id === sectionId));
      const [studentData, subjectData] = await Promise.all([
        studentService.getAll({ schoolId, sectionId }),
        selectedClass ? academicService.getSubjectsByClass(selectedClass.id) : Promise.resolve([]),
      ]);
      setStudents(studentData);
      setSubjects(subjectData);
    } catch {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [schoolId, sectionId, classes]);

  useEffect(() => { loadGrid(); }, [loadGrid]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Results"
        description="Enter and publish section-wise marks by academic year."
      />
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Academic Year"
              placeholder={metaLoading ? 'Loading years…' : 'Select an academic year'}
              loading={metaLoading}
              options={years.map((y) => ({ value: y.id, label: `${y.name}${y.isCurrent ? ' (current)' : ''}` }))}
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
            />
            <Select
              label="Exam"
              placeholder={examsLoading ? 'Loading exams…' : 'Select an exam'}
              loading={examsLoading}
              options={exams.map((e) => ({ value: e.id, label: e.name }))}
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            />
          </div>
          <Select
            label="Section"
            placeholder={metaLoading ? 'Loading sections…' : 'Select a section'}
            loading={metaLoading}
            options={sectionOptions}
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
          />
          {!examId && !metaLoading && !examsLoading && <p className="text-sm text-amber-600">Select an academic year and exam to enter results.</p>}
        </CardContent>
      </Card>
      {examId && sectionId && (
        <ResultsWorkspace
          examId={examId}
          students={students}
          subjects={subjects}
          loading={loading}
          onSaved={loadGrid}
          readOnly={isReadOnly}
        />
      )}
      {examId && students.length > 0 && (
        <ResultCardPicker examId={examId} students={students} loading={loading} />
      )}
    </div>
  );
}
