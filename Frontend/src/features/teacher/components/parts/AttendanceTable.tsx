'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Student, AttendanceStatus } from '@/types';
import { Card, CardHeader, CardContent } from '@/features/shared/components';
import { cn } from '@/lib/utils';
import KeyboardHints from './KeyboardHints';
import UndoToast from './UndoToast';

const KEY_MAP: Record<string, AttendanceStatus> = { '1': 'PRESENT', '2': 'LATE', '3': 'ABSENT', '4': 'LEAVE' };
const MAX_HISTORY = 30;
type UndoEntry = { studentId: string; studentName: string; prevStatus: AttendanceStatus };
interface Props {
  students: Student[];
  marks: Record<string, AttendanceStatus>;
  percentages: Record<string, number>;
  onToggle: (studentId: string, status: AttendanceStatus) => void;
  onBulkSet?: (marks: Record<string, AttendanceStatus>) => void;
}

export default function AttendanceTable({ students, marks, percentages, onToggle, onBulkSet }: Props) {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<UndoEntry[]>([]);

  const pushUndo = useCallback((sid: string, prev: AttendanceStatus) => {
    const s = students.find((x) => x.id === sid);
    historyRef.current.push({ studentId: sid, studentName: s ? `${s.firstName} ${s.lastName}` : 'Student', prevStatus: prev });
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
  }, [students]);

  const handleUndo = useCallback(() => {
    const last = historyRef.current.pop();
    if (!last) return;
    onToggle(last.studentId, last.prevStatus);
    setToastMsg(`Undid → ${last.studentName}`);
  }, [onToggle]);
  const handleUndoAll = useCallback(() => {
    if (historyRef.current.length === 0 || !onBulkSet) return;
    const entries = [...historyRef.current].reverse();
    const merged = { ...marks };
    for (const e of entries) merged[e.studentId] = e.prevStatus;
    onBulkSet(merged);
    const count = historyRef.current.length;
    historyRef.current = [];
    setToastMsg(`Undid last ${count} change${count > 1 ? 's' : ''}`);
  }, [marks, onBulkSet]);

  const scrollToRow = useCallback((idx: number) => {
    tableRef.current?.querySelectorAll('tbody tr')[idx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (students.length === 0) return;
    const key = e.key;
    if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return; }
    if ((e.ctrlKey || e.metaKey) && key === 'z' && e.shiftKey) { e.preventDefault(); handleUndoAll(); return; }
    if (key === 'ArrowDown' || key === 'j') {
      e.preventDefault();
      setFocusedIdx((p) => { const n = p === null ? 0 : Math.min(p + 1, students.length - 1); scrollToRow(n); return n; });
      return;
    }
    if (key === 'ArrowUp' || key === 'k') {
      e.preventDefault();
      setFocusedIdx((p) => { const n = p === null ? 0 : Math.max(p - 1, 0); scrollToRow(n); return n; });
      return;
    }
    const status = KEY_MAP[key];
    if (status && focusedIdx !== null && focusedIdx < students.length) {
      e.preventDefault();
      pushUndo(students[focusedIdx].id, marks[students[focusedIdx].id] ?? 'PRESENT');
      onToggle(students[focusedIdx].id, status);
      if (focusedIdx < students.length - 1) { setFocusedIdx(focusedIdx + 1); scrollToRow(focusedIdx + 1); }
    }
  }, [students, focusedIdx, onToggle, marks, pushUndo, handleUndo, handleUndoAll, scrollToRow]);

  useEffect(() => { window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey); }, [handleKey]);

  const badge = (s: AttendanceStatus, id: string, active: boolean) => {
    const labels: Record<string, string> = { PRESENT: 'P', LATE: 'L', ABSENT: 'A', LEAVE: 'LV' };
    const cls: Record<string, string> = { PRESENT: 'bg-emerald-600 text-white ring-emerald-300', LATE: 'bg-yellow-500 text-white ring-amber-300', ABSENT: 'bg-red-600 text-white ring-red-300', LEAVE: 'bg-primary-500 text-white ring-primary-300' };
    return (
      <button key={s} onClick={() => { pushUndo(id, marks[id] ?? 'PRESENT'); onToggle(id, s); }}
        className={cn('w-9 h-8 rounded-lg text-[11px] font-bold transition-all', active ? cn(cls[s], 'ring-2 ring-offset-1') : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600')}>
        {labels[s]}
      </button>
    );
  };

  const avatarColor = (st?: string) => st === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : st === 'LATE' ? 'bg-amber-100 text-amber-700' : st === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700';

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{students.length} Students</h2>
          <KeyboardHints undoCount={historyRef.current.length} onUndoAll={handleUndoAll} />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto" ref={tableRef}>
          <table className="w-full min-w-[480px] text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s, idx) => (
                <tr key={s.id} className={cn('cursor-pointer transition-all', focusedIdx === idx && 'bg-primary-50 ring-1 ring-inset ring-primary-200')} onClick={() => setFocusedIdx(idx)}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {focusedIdx === idx && <span className="w-1 h-6 rounded-full bg-primary-500 shrink-0" />}
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', avatarColor(marks[s.id]))}>
                        {s.firstName?.[0]}{s.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-[10px] text-gray-400">Roll #{s.rollNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {percentages[s.id] != null && percentages[s.id] >= 0 ? (
                      <span className={cn('text-sm font-bold tabular-nums', percentages[s.id] >= 80 ? 'text-emerald-600' : percentages[s.id] >= 60 ? 'text-amber-600' : 'text-red-600')}>
                        {percentages[s.id]}<span className="text-[10px] font-medium">%</span>
                      </span>
                    ) : <span className="text-[10px] text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {(['PRESENT', 'LATE', 'ABSENT', 'LEAVE'] as const).map((st) => badge(st, s.id, marks[s.id] === st))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    <UndoToast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </>
  );
}
