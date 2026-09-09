'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { PageHeader, Card, CardContent, Button, ConfirmDialog, EmptyState, Select, CardGridSkeleton } from '@/features/shared/components';
import { examService } from '@/lib/api';
import { academicService, type Term } from '@/lib/api/academicService';
import type { AcademicYear, Exam } from '@/types';
import ExamFormModal from './parts/ExamFormModal';
import ExamCard from './parts/ExamCard';
import ExamStatCards from './parts/ExamStatCards';
import toast from 'react-hot-toast';

export default function ExamSchedulePage() {
  const { user, school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [yearId, setYearId] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState<Exam | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      const [examData, termsData] = await Promise.all([
        examService.getBySchool(schoolId, yearId || undefined),
        yearId ? academicService.getTerms(yearId) : Promise.resolve([]),
      ]);
      setExams(examData);
      setTerms(termsData);
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [schoolId, yearId]);

  useEffect(() => { loadYears(); }, [loadYears]);
  useEffect(() => { if (yearId) load(); }, [load]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingId(deleting.id);
    try {
      await examService.remove(deleting.id);
      toast.success('Exam deleted');
      await load();
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
      setDeleting(null);
    }
  };

  const handleDownload = async (exam: Exam) => {
    try {
      await examService.downloadDateSheet(exam.id, exam.name);
      toast.success('Date sheet downloaded');
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Schedule"
        description="Create term exams and assign date-wise papers."
        actions={<Button onClick={() => { setEditing(null); setShowCreate(true); }}>+ New Exam</Button>}
      />
      <ExamStatCards exams={exams} terms={terms} />
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
            <EmptyState
              icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
              title="No exams scheduled"
              description={yearId ? 'No exams scheduled for this academic year yet.' : 'Create the first exam to publish the schedule.'}
              action={<Button onClick={() => { setEditing(null); setShowCreate(true); }}>+ New Exam</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {exams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} deleting={deletingId === exam.id} onDelete={setDeleting}
                  onEdit={setEditing} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ExamFormModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setEditing(null); }}
        onSaved={load}
        schoolId={schoolId ?? ''}
        terms={terms}
        exam={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete this exam?"
        message={`"${deleting?.name}" and all of its results will be deleted.`}
        confirmLabel="Delete"
        variant="danger"
        loading={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}