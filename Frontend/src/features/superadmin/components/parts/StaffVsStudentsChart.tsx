'use client';

import { memo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card } from '@/features/shared/components';
import ChartTooltip from './ChartTooltip';
import type { OrgBranchStat } from '@/types';

interface StaffVsStudentsChartProps {
  branches: OrgBranchStat[];
}

const StaffVsStudentsChart = memo(function StaffVsStudentsChart({ branches }: StaffVsStudentsChartProps) {
  const data = branches.map((b) => ({
    name: b.code,
    Staff: b.staffCount,
    Students: b.studentCount,
  }));

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Staff vs Students by Branch</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No branches yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={12} angle={-12} textAnchor="end" height={44} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Staff" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Students" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
});

export default StaffVsStudentsChart;
