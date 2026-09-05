'use client';

import { memo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';
import { Card } from '@/features/shared/components';
import ChartTooltip from './ChartTooltip';

interface EnrollmentChartProps {
  monthly: { key: string; label: string; count: number }[];
}

const EnrollmentChart = memo(function EnrollmentChart({ monthly }: EnrollmentChartProps) {
  const data = monthly.map((m) => ({ month: m.label, 'New Students': m.count }));
  const total = monthly.reduce((s, m) => s + m.count, 0);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-gray-900">Student Enrollment</h3>
        <p className="text-sm text-gray-500">
          Total: <span className="font-bold text-gray-900 tabular-nums">{total}</span>
        </p>
      </div>
      {data.length === 0 || total === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No enrollment data yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
            <Bar dataKey="New Students" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
});

export default EnrollmentChart;
