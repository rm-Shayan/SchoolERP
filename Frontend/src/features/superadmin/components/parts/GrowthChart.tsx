'use client';

import { memo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface GrowthChartProps {
  growth: { key: string; label: string; count: number }[];
}

const GrowthChart = memo(function GrowthChart({ growth }: GrowthChartProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 lg:col-span-1">
      <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight mb-4">Organization Growth (last 12 months)</h2>
      {growth.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
          No growth data yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={growth} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip cursor={{ stroke: '#e2e8f0' }} />
            <Line
              type="monotone"
              dataKey="count"
              name="New orgs"
              stroke="#7c3aed"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

export default GrowthChart;
