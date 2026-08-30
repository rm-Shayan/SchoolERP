'use client';

import { motion } from 'framer-motion';
import { Badge, Button } from '@/features/shared/components';
import type { Exam } from '@/types';

interface ExamCardProps {
  exam: Exam;
  deleting: boolean;
  onDelete: (exam: Exam) => void;
  onEdit?: (exam: Exam) => void;
  onDownload?: (exam: Exam) => void;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function ExamCard({ exam, deleting, onDelete, onEdit, onDownload }: ExamCardProps) {
  const start = new Date(exam.startDate);
  const end = new Date(exam.endDate);
  const upcoming = end.getTime() >= Date.now();
  const paperCount = exam.papers?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-primary-200/70 hover:shadow-[0_12px_32px_rgba(124,58,237,0.1)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-400 opacity-70" />
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-lg shadow-primary-600/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary-100">{MONTHS[start.getMonth()]}</span>
          <span className="text-2xl font-black leading-none tabular-nums">{start.getDate()}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-800">{exam.name}</h3>
            <Badge variant={upcoming ? 'success' : 'default'}>{upcoming ? 'Upcoming' : 'Past'}</Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {start.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} — {end.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Term: <span className="font-semibold text-slate-700">{exam.term?.name ?? '—'}</span>
            {exam.term?.academicYear ? <span className="text-slate-400"> · {exam.term.academicYear.name}</span> : ''}
            {paperCount > 0 && <span className="text-slate-400"> · {paperCount} paper{paperCount === 1 ? '' : 's'}</span>}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
              {onDownload && (
                <Button size="sm" variant="outline" onClick={() => onDownload(exam)}>
                  Date Sheet ↓
                </Button>
              )}
              {onEdit && (
                <Button size="sm" variant="ghost" onClick={() => onEdit(exam)}>
                  Edit
                </Button>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(exam)}
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}