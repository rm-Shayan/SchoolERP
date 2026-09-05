'use client';

import { memo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Card } from '@/features/shared/components';
import ChartTooltip from './ChartTooltip';

interface AttendanceRateChartProps {
  monthly: { key: string; label: string; rate: number }[];
}

const AttendanceRateChart = memo(function AttendanceRateChart({ monthly }: AttendanceRateChartProps) {
  const data = monthly.map((m) => ({ month: m.label, 'Attendance %': m.rate }));
  const avg = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d['Attendance %'], 0) / data.length)
    : 0;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-gray-900">Attendance Rate</h3>
        <p className="text-sm text-gray-500">
          Avg: <span className="font-bold text-gray-900 tabular-nums">{avg}%</span>
        </p>
      </div>
      {data.length === 0 || avg === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No attendance data yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip cursor={{ stroke: '#e2e8f0' }} content={<ChartTooltip />} />
            <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '80%', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
            <Line type="monotone" dataKey="Attendance %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
});

export default AttendanceRateChart;
