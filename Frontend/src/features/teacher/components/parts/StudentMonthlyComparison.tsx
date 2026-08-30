'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, EmptyState } from '@/features/shared/components';
import { attendanceService } from '@/lib/api';
import type { Student } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthlyData {
  month: number;
  year: number;
  total: number;
  present: number;
  pct: number;
}

interface StudentRow {
  student: Student;
  months: Map<string, MonthlyData>;
  overallPct: number;
}

interface Props {
  students: Student[];
}

const StudentMonthlyComparison = memo(function StudentMonthlyComparison({ students }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [sortKey, setSortKey] = useState<'name' | 'overall'>('overall');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const now = useMemo(() => new Date(), []);

  const load = useCallback(async () => {
    if (students.length === 0) { setLoading(false); return; }
    setLoading(true);
    try {
      const results = await Promise.allSettled(students.map(async (s) => {
        const records = await attendanceService.getStudentHistory(s.id);
        const monthMap = new Map<string, MonthlyData>();
        let totalGood = 0, totalAll = 0;

        records.forEach((r) => {
          const dt = new Date(r.date);
          const key = `${dt.getFullYear()}-${dt.getMonth()}`;
          const existing = monthMap.get(key);
          if (existing) {
            existing.total++;
            if (r.status === 'PRESENT' || r.status === 'LATE') existing.present++;
          } else {
            monthMap.set(key, {
              month: dt.getMonth(), year: dt.getFullYear(),
              total: 1, present: r.status === 'PRESENT' || r.status === 'LATE' ? 1 : 0, pct: 0,
            });
          }
          totalAll++;
          if (r.status === 'PRESENT' || r.status === 'LATE') totalGood++;
        });

        monthMap.forEach((m) => { m.pct = m.total > 0 ? Math.round((m.present / m.total) * 100) : 0; });
        return { student: s, months: monthMap, overallPct: totalAll > 0 ? Math.round((totalGood / totalAll) * 100) : -1 };
      }));

      const data = results
        .filter((r): r is PromiseFulfilledResult<StudentRow> => r.status === 'fulfilled')
        .map((r) => r.value);
      setRows(data);
    } catch { toast.error('Failed to load comparison'); }
    finally { setLoading(false); }
  }, [students]);

  useEffect(() => { load(); }, [load]);

  // Visible months: last 6 months
  const visibleMonths = useMemo(() => {
    const months: { key: string; label: string; month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`, month: d.getMonth(), year: d.getFullYear() });
    }
    return months;
  }, [now]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (sortKey === 'name') return sortDir === 'asc' ? `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`) : `${b.student.firstName} ${b.student.lastName}`.localeCompare(`${a.student.firstName} ${a.student.lastName}`);
      return sortDir === 'asc' ? a.overallPct - b.overallPct : b.overallPct - a.overallPct;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: 'name' | 'overall') => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const pctCell = (pct: number) => {
    if (pct < 0) return <span className="text-[10px] text-gray-300">—</span>;
    return <span className={cn('text-xs font-bold tabular-nums', pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600')}>{pct}%</span>;
  };

  if (loading) return <Card><CardContent><div className="animate-pulse space-y-3 py-8">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div></CardContent></Card>;
  if (rows.length === 0) return <Card><EmptyState title="No data" description="No attendance history found for this section." /></Card>;

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => toggleSort('name')}>
                Student {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              {visibleMonths.map((m) => (
                <th key={m.key} className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{m.label}</th>
              ))}
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:text-gray-700" onClick={() => toggleSort('overall')}>
                Overall {sortKey === 'overall' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((row) => (
              <tr key={row.student.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0', row.overallPct >= 80 ? 'bg-emerald-100 text-emerald-700' : row.overallPct >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                      {row.student.firstName?.[0]}{row.student.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{row.student.firstName} {row.student.lastName}</p>
                      <p className="text-[9px] text-gray-400">Roll #{row.student.rollNumber}</p>
                    </div>
                  </div>
                </td>
                {visibleMonths.map((m) => {
                  const data = row.months.get(m.key);
                  return (
                    <td key={m.key} className="px-3 py-2.5 text-center">
                      {data ? (
                        <div className="flex flex-col items-center">
                          {pctCell(data.pct)}
                          <span className="text-[8px] text-gray-400">{data.present}/{data.total}</span>
                        </div>
                      ) : <span className="text-[10px] text-gray-200">—</span>}
                    </td>
                  );
                })}
                <td className="px-4 py-2.5 text-center">{pctCell(row.overallPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
});

export default StudentMonthlyComparison;
