'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, EmptyState, Button, ListSkeleton, Badge } from '@/features/shared/components';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalExamSheet } from '@/types/portal';
import toast from 'react-hot-toast';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function PaperHeader({ className }: { className?: string }) {
  return (
    <div className={`hidden grid-cols-12 gap-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:grid ${className ?? ''}`}>
      <span className="col-span-3">Class</span>
      <span className="col-span-4">Subject</span>
      <span className="col-span-2">Date</span>
      <span className="col-span-2">Time</span>
      <span className="col-span-1 text-right">Marks</span>
    </div>
  );
}

function PaperRow({ p }: { p: { id: string; classId: string; subjectId: string; sectionId?: string | null; date: string; startTime?: string | null; endTime?: string | null; maxMarks?: number | null; roomNumber?: string | null; class: { id: string; name: string }; subject: { id: string; name: string }; section?: { id: string; name: string } | null } }) {
  const d = new Date(p.date);
  const time = p.startTime ? `${p.startTime}${p.endTime ? `–${p.endTime}` : ''}` : '—';
  return (
    <div className="grid grid-cols-1 gap-1 px-3 py-2 text-sm rounded-lg bg-gray-50 sm:grid-cols-12 sm:items-center sm:gap-2 hover:bg-gray-100 transition-colors">
      <span className="col-span-3 font-medium text-gray-900">{p.class.name}{p.section ? ` • ${p.section.name}` : ''}</span>
      <span className="col-span-4 text-gray-700">{p.subject.name}</span>
      <span className="col-span-2 text-gray-600">{d.getMonth() + 1}/{d.getDate()}</span>
      <span className="col-span-2 font-mono text-xs text-gray-500">{time}{p.roomNumber ? ` · R${p.roomNumber}` : ''}</span>
      <span className="col-span-1 text-right font-semibold text-gray-700">{p.maxMarks ?? '—'}</span>
    </div>
  );
}

export default function ExamSheetTab() {
  const theme = getOrgThemeColor();
  const [exams, setExams] = useState<PortalExamSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalDataService.getExams().then(setExams).finally(() => setLoading(false));
  }, []);

  if (loading) return <ListSkeleton count={3} />;

  if (exams.length === 0) {
    return <Card className="p-8"><EmptyState title="No exams scheduled" description="Date sheets for your child's class will appear here once published." /></Card>;
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => {
        const start = new Date(String(exam.startDate).slice(0, 10));
        return (
          <Card key={exam.id}>
            <CardContent className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl text-white shadow-sm" style={{ background: theme || '#6366f1' }}>
                    <span className="text-[8px] font-bold tracking-widest opacity-90">{MONTHS[start.getMonth()]}</span>
                    <span className="text-base font-black leading-none">{start.getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{exam.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(String(exam.startDate).slice(0, 10)).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} — {new Date(String(exam.endDate).slice(0, 10)).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {exam.term?.name ? <span className="ml-2"> · {exam.term.name}</span> : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{exam.papers.length} paper{exam.papers.length === 1 ? '' : 's'}</Badge>
                  <Button size="sm" variant="outline" onClick={() => portalDataService.downloadExamDateSheet(exam.id, exam.name).catch(() => toast.error('Download failed'))}>
                    Date Sheet ↓
                  </Button>
                </div>
              </div>
              <PaperHeader className="mb-1" />
              <div className="space-y-1.5">
                {exam.papers.map((p) => <PaperRow key={p.id} p={p} />)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}