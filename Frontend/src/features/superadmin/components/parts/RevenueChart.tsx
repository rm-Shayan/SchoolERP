'use client';

import { memo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/features/shared/components';
import ChartTooltip from './ChartTooltip';
import type { OrgDashboardRevenue } from '@/types';

interface RevenueChartProps {
  revenue: OrgDashboardRevenue;
}

const RevenueChart = memo(function RevenueChart({ revenue }: RevenueChartProps) {
  const data = revenue.monthly.map((m) => ({
    month: m.label,
    Revenue: Math.round(m.total),
  }));

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-gray-900">Annual Revenue (last 12 months)</h3>
        <p className="text-sm text-gray-500">
          Total:{' '}
          <span className="font-bold text-gray-900 tabular-nums">
            {revenue.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </p>
      </div>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No fee payments recorded yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
            <Tooltip cursor={{ stroke: '#e2e8f0' }} content={<ChartTooltip />} />
            <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
});

export default RevenueChart;
