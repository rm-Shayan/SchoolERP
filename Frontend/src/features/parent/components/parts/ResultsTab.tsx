'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, EmptyState } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalExamResult } from '@/types/portal';
import { formatDate } from '@/lib/utils';
import { ResultsSkeleton } from './PortalSkeletonsB';

export default function ResultsTab() {
  const [results, setResults] = useState<PortalExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalDataService.getResults().then(setResults).finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, { exam: PortalExamResult['exam']; items: PortalExamResult[] }>();
    results.forEach((r) => {
      const key = r.exam.id;
      if (!map.has(key)) map.set(key, { exam: r.exam, items: [] });
      map.get(key)!.items.push(r);
    });
    return [...map.values()];
  }, [results]);

  if (loading) return <ResultsSkeleton />;

  if (results.length === 0) {
    return <Card className="p-8"><EmptyState title="No results published" description="Exam results will appear here once published." /></Card>;
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ exam, items }) => {
        const totalObtained = items.reduce((s, r) => s + Number(r.marksObtained), 0);
        const totalMax = items.reduce((s, r) => s + Number(r.maxMarks), 0);
        const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
        return (
          <Card key={exam.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{exam.name}</h3>
                  <p className="text-xs text-gray-500">{exam.term?.name} · {formatDate(exam.startDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{totalObtained}/{totalMax}</p>
                  <p className="text-xs text-gray-500">{pct}%</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-medium text-gray-500">Subject</th>
                    <th className="text-right py-2 font-medium text-gray-500">Marks</th>
                    <th className="text-right py-2 font-medium text-gray-500">%</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => {
                    const p = Number(r.maxMarks) > 0 ? Math.round((Number(r.marksObtained) / Number(r.maxMarks)) * 100) : 0;
                    return (
                      <tr key={r.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 text-gray-900">{r.subject.name}</td>
                        <td className="py-2 text-right text-gray-700">{r.marksObtained}/{r.maxMarks}</td>
                        <td className="py-2 text-right">
                          <span className={`font-medium ${p >= 80 ? 'text-green-600' : p >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {p}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
