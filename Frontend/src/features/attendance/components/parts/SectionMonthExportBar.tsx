'use client';

import { useState } from 'react';
import type { AttendanceRecord, StudentLite } from '@/types';
import { exportSectionMatrixCsv, exportStudentMonthCsv } from './attendanceReportCsv';

interface Props {
  sectionLabel: string;
  students: StudentLite[];
  records: AttendanceRecord[];
  offDays: { date: string; reason?: string | null }[];
  weeklyOff: number[];
  year: number;
  month: number;
}

/** Section monthly view ke liye CSV export — poora matrix ya ek student ki detail. */
export default function SectionMonthExportBar({ sectionLabel, students, records, offDays, weeklyOff, year, month }: Props) {
  const [studentId, setStudentId] = useState('');

  const handleExport = () => {
    if (studentId) {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;
      exportStudentMonthCsv({ student, records: records.filter((r) => r.studentId === student.id), offDays, weeklyOff, year, month });
    } else {
      exportSectionMatrixCsv({ students, records, offDays, weeklyOff, year, month, label: sectionLabel });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        title="Student (blank = poora section matrix)"
        className="h-8 max-w-[180px] rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-primary-300"
      >
        <option value="">Whole section (matrix)</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.firstName} {s.lastName} — #{s.rollNumber}
          </option>
        ))}
      </select>
      <button
        onClick={handleExport}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 transition hover:bg-primary-50 hover:text-primary-700 hover:ring-primary-200"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
        </svg>
        Export CSV
      </button>
    </div>
  );
}
