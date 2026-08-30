'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { PageHeader, Card, CardContent, Badge, Button, EmptyState, Select, CardGridSkeleton } from '@/features/shared/components';
import { examService } from '@/lib/api';
import { teachingAssignmentService, type TeachingAssignment } from '@/lib/api/teachingAssignmentService';
import { academicService } from '@/lib/api/academicService';
import type { AcademicYear, Exam } from '@/types';
import { formatDate } from '@/lib/utils';
import TeacherResultsWorkspace from './parts/TeacherResultsWorkspace';
import toast from 'react-hot-toast';

export default function TeacherExamsPage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  const loadYears = useCallback(async () => {
    if (!schoolId) return;
    setYearsLoading(true);
    try {
      const data = await academicService.getYearsBySchool(schoolId);
      setYears(data);
      const current = data.find((y) => y.isCurrent) ?? data[0];
      setYearId((prev) => (prev && data.some((y) => y.id === prev) ? prev : current?.id ?? ''));
    } catch {
      toast.error('Failed to load academic years');
    } finally {
      setYearsLoading(false);
    }
  }, [schoolId]);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [examData, assignmentData] = await Promise.all([
        examService.getBySchool(schoolId, yearId || undefined),
        teachingAssignmentService.listMine(schoolId),
      ]);
      setExams(examData);
      setAssignments(assignmentData);
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [schoolId, yearId]);

  useEffect(() => { loadYears(); }, [loadYears]);
  useEffect(() => { if (yearId) load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);

  if (activeExam) {
    return (
      <TeacherResultsWorkspace
        schoolId={schoolId ?? ''}
        examId={activeExam.id}
        examName={activeExam.name}
        assignments={assignments}
        onBack={() => setActiveExam(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams & Results"
        description="View your class's exams and upload results."
      />
      <Card>
        <CardContent>
          <Select
            label="Academic Year"
            placeholder={yearsLoading ? 'Loading years…' : 'Select an academic year'}
            loading={yearsLoading}
            options={years.map((y) => ({ value: y.id, label: `${y.name}${y.isCurrent ? ' (current)' : ''}` }))}
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          {loading ? (
            <CardGridSkeleton count={3} />
          ) : exams.length === 0 ? (
            <EmptyState title="No exams scheduled yet" description="Published exams will appear here." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {exams.map((exam) => {
                const upcoming = exam.startDate >= today;
                return (
                  <div key={exam.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-800">{exam.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDate(exam.startDate)} — {formatDate(exam.endDate)}
                        </p>
                      </div>
                      <Badge variant={upcoming ? 'info' : 'default'}>
                        {upcoming ? 'Upcoming' : 'Completed'}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-1 flex-col justify-end gap-3 border-t border-slate-100 pt-3">
                      <p className="text-xs font-medium text-slate-500">
                        Term: {exam.term?.name ?? '—'}
                        <span className="ml-3">Results: {exam._count?.results ?? 0}</span>
                        {exam.papers ? <span className="ml-3">Papers: {exam.papers.length}</span> : null}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => examService.downloadDateSheet(exam.id, exam.name).catch(() => toast.error('Date sheet download failed'))}
                        >
                          Date Sheet ↓
                        </Button>
                        <Button size="sm" disabled={assignments.length === 0} onClick={() => setActiveExam(exam)}>
                          Enter Results
                        </Button>
                      </div>
                      {assignments.length === 0 && (
                        <p className="text-xs text-amber-600">No class has been assigned to you yet.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}