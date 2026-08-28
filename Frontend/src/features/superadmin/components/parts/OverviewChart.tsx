'use client';

import { memo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { CHART_COLORS, type ChartRow } from './helpers';

interface OverviewChartProps {
  chartData: ChartRow[];
  socketStatus: string;
  lastUpdated: Date | null;
  refreshing: boolean;
}

const legend = [
  { label: 'Branches', color: CHART_COLORS[0] },
  { label: 'Students', color: CHART_COLORS[2] },
  { label: 'Staff', color: CHART_COLORS[1] },
];

const OverviewChart = memo(function OverviewChart({
  chartData,
  socketStatus,
  lastUpdated,
  refreshing,
}: OverviewChartProps) {
  return (
    <div className={cn(
      'lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6',
      'transition-all duration-300',
      refreshing && 'ring-2 ring-primary-200 shadow-[0_8px_32px_rgba(124,58,237,0.12)]'
    )}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Branches & Students by Organization</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              socketStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
                : socketStatus === 'error'
                  ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200/60'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60'
            )}
            title={`Socket: ${socketStatus}`}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                socketStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-current'
              )}
            />
            {socketStatus === 'connected' ? 'Live' : 'Reconnecting...'}
          </span>
          {refreshing ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Refreshing...
            </span>
          ) : (
            lastUpdated && (
              <span className="text-xs text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</span>
            )
          )}
          <Link href="/admin/organizations" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            View all →
          </Link>
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
          No organizations yet — create one to see the chart.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} angle={-12} textAnchor="end" height={48} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="Branches" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Students" fill={CHART_COLORS[2]} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Staff" fill={CHART_COLORS[1]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
            {legend.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

export default OverviewChart;
