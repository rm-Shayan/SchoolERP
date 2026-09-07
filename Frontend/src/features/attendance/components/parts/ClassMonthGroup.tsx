'use client';

import Link from 'next/link';
import type { ClassAttendanceGroup } from '@/types';
import { exportSchoolMonthlyCsv, exportSectionMatrixCsv } from './attendanceReportCsv';
import toast from 'react-hot-toast';

interface Props {
  cls: ClassAttendanceGroup;
  slug?: string;
  offDays: { date: string; reason?: string | null }[];
  weeklyOff: number[];
  year: number;
  month: number;
}

function safeName(n: string) {
  return (n || 'class').replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '');
}
function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }

const DnIcon = ({ title, onClick }: { title: string; onClick: () => void }) => (
  <button onClick={onClick} title={title}
    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-400 ring-1 ring-gray-200 transition hover:bg-primary-50 hover:text-primary-700 hover:ring-primary-200">
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
    </svg>
  </button>
);

/** Monthly overview — one class group: class CSV in the header, section CSV on each row. */
export default function ClassMonthGroup({ cls, slug, offDays, weeklyOff, year, month }: Props) {
  const exportClass = () => {
    if (cls.sections.every((s) => s.students.length === 0 && s.records.length === 0)) {
      toast.error('No students or records for this class'); return;
    }
    exportSchoolMonthlyCsv({
      classes: [{ className: cls.className, sections: cls.sections.map((s) => ({ sectionName: s.sectionName, students: s.students, records: s.records })) }],
      offDays, weeklyOff, year, month,
      filename: `monthly-${safeName(cls.className)}-${year}-${pad2(month)}`,
    });
  };
  const exportSection = (sec: ClassAttendanceGroup['sections'][number]) => {
    if (sec.students.length === 0 && sec.records.length === 0) {
      toast.error('No students or records for this section'); return;
    }
    exportSectionMatrixCsv({ students: sec.students, records: sec.records, offDays, weeklyOff, year, month, label: `${cls.className} ${sec.sectionName}` });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <p className="text-sm font-bold text-gray-900">{cls.className}</p>
        <DnIcon title="Export class CSV" onClick={exportClass} />
      </div>
      <div className="divide-y divide-gray-50">
        {cls.sections.map((sec) => {
          const totalR = sec.summary.totalRecords;
          const pct = totalR > 0 ? Math.round(((sec.summary.present + sec.summary.late) / totalR) * 100) : 0;
          const detailPath = slug ? `/o/${slug}/branch/attendance/records/${sec.sectionId}` : `/branch/attendance/records/${sec.sectionId}`;
          return (
            <div key={sec.sectionId} className="flex items-center justify-between p-4 transition hover:bg-gray-50/50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{sec.sectionName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-gray-400">{sec.summary.totalStudents} students</span>
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{sec.summary.present}P</span>
                  <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{sec.summary.late}L</span>
                  <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">{sec.summary.absent}A</span>
                  <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">{sec.summary.leave}Lv</span>
                  {(sec.summary.halfDay ?? 0) > 0 && (
                    <span className="rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">{sec.summary.halfDay}HD</span>
                  )}
                </div>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <p className="text-lg font-extrabold text-gray-900">{pct}<span className="text-xs font-medium text-gray-400">%</span></p>
                </div>
                <DnIcon title="Export section CSV" onClick={() => exportSection(sec)} />
                <Link href={detailPath}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary-50 px-3 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100">
                  Details
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
