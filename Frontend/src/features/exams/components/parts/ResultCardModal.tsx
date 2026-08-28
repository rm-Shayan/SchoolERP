'use client';

import { useEffect, useState } from 'react';
import { Modal, Loading, Button } from '@/features/shared/components';
import { examService, type ResultCard } from '@/lib/api/examService';
import type { Student } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  examId: string;
  student: Student | null;
  onClose: () => void;
}

export default function ResultCardModal({ examId, student, onClose }: Props) {
  const [card, setCard] = useState<ResultCard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!student) return;
    setCard(null);
    setLoading(true);
    examService
      .getStudentCard(examId, student.id)
      .then(setCard)
      .catch(() => toast.error('Could not generate result card'))
      .finally(() => setLoading(false));
  }, [examId, student]);

  const gradeColor = card?.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

  return (
    <Modal
      open={!!student}
      onClose={onClose}
      title={card ? `Result Card — ${card.student.name}` : 'Result Card'}
      size="md"
    >
      {!student ? null : loading ? (
        <Loading label="Generating result card..." />
      ) : !card ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.exam.name}</p>
            <p className="mt-1 text-sm text-slate-600">{card.student.section}</p>
            <p className="text-xs text-slate-400">Roll #{card.student.rollNumber}</p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{card.percentage}%</p>
                <p className="text-xs text-slate-500">Percentage</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{card.grade}</p>
                <p className="text-xs text-slate-500">Grade</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{card.division}</p>
                <p className="text-xs text-slate-500">Division</p>
              </div>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${gradeColor}`}>
              {card.result}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Subject</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">Marks</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-600">Max</th>
                </tr>
              </thead>
              <tbody>
                {card.subjects.map((s, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-700">{s.subject}</td>
                    <td className="px-3 py-2 text-center text-slate-700">{s.marksObtained}</td>
                    <td className="px-3 py-2 text-center text-slate-500">{s.maxMarks}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-3 py-2 font-semibold text-slate-700">Total</td>
                  <td className="px-3 py-2 text-center font-semibold text-slate-800">{card.totalObtained}</td>
                  <td className="px-3 py-2 text-center font-semibold text-slate-500">{card.totalMax}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}