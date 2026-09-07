'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useParams } from 'next/navigation';
import { attendanceService } from '@/lib/api/attendanceService';
import type { AttendanceRecord, StudentLite } from '@/types';
import { exportSectionMatrixCsv } from './parts/attendanceReportCsv';
import SectionDetailDaily from './parts/SectionDetailDaily';
import SectionMonthPanel from './parts/SectionMonthPanel';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const selectCls = 'h-8 rounded-lg border border-gray-200 bg-white px-1.5 text-xs outline-none focus:ring-2 focus:ring-primary-300';

function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }

export default function SectionAttendanceDetailPage() {
  const params = useParams();
  const sectionId = params?.sectionId as string;
  const { user, school, organization } = useAppSelector((s) => s.auth);
  const schoolId = school?.id ?? user?.schoolId;
  const slug = organization?.slug;
  const now = new Date();
  const [mode, setMode] = useState<'daily' | 'monthly'>('daily');
  const [csvBusy, setCsvBusy] = useState(false);
  const [csvYear, setCsvYear] = useState(now.getFullYear());
  const [csvMonth, setCsvMonth] = useState(now.getMonth() + 1);
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.getFullYear() - i), []);

  const backPath = slug ? `/o/${slug}/branch/attendance/records` : '/branch/attendance/records';

  // On the detail page, no need to open the Monthly tab — export the chosen month's CSV immediately.
  const downloadMonthlyCsv = async () => {
    if (!schoolId) { toast.error('No school context'); return; }
    setCsvBusy(true);
    try {
      const year = csvYear;
      const month = csvMonth;
      const report = await attendanceService.getMonthlyReport({ schoolId, year, month });
      let label = ''; let students: StudentLite[] = []; let records: AttendanceRecord[] = [];
      for (const cls of report.classes) {
        const sec = cls.sections.find((s) => s.sectionId === sectionId);
        if (sec) { label = `${cls.className} ${sec.sectionName}`.trim(); students = sec.students; records = sec.records; break; }
      }
      if (!label) { toast.error('No attendance data for this section this month'); return; }
      exportSectionMatrixCsv({
        students, records, offDays: report.offDays ?? [], weeklyOff: report.weeklyOff ?? [0, 6],
        year, month, label,
      });
    } catch { toast.error('Failed to export'); }
    finally { setCsvBusy(false); }
  };

  const monthPicker = (
    <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-1">
      <select value={String(csvMonth)} onChange={(e) => setCsvMonth(Number(e.target.value))} title="Month" className={selectCls}>
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select value={String(csvYear)} onChange={(e) => setCsvYear(Number(e.target.value))} title="Year" className={selectCls}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={backPath} className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Records
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Section Attendance</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex w-fit gap-1 rounded-xl bg-gray-100 p-1">
            {([
              { key: 'daily' as const, label: '📅 Daily' },
              { key: 'monthly' as const, label: '📊 Monthly' },
            ]).map((t) => (
              <button key={t.key} onClick={() => setMode(t.key)}
                className={cn('rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                  mode === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                {t.label}
              </button>
            ))}
          </div>
          {monthPicker}
          <button onClick={downloadMonthlyCsv} disabled={csvBusy}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
            {csvBusy ? 'Exporting…' : 'Monthly CSV'}
          </button>
        </div>
      </div>

      {mode === 'daily' ? (
        <SectionDetailDaily sectionId={sectionId} sectionName="" className="" />
      ) : (
        <SectionMonthPanel sectionId={sectionId} />
      )}
    </div>
  );
}
