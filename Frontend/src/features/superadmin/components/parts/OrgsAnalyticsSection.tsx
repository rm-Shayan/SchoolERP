'use client';

import { memo, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import type { PlatformOverview } from '@/types';
import { buildChartData, CHART_COLORS } from './helpers';
import GrowthChart from './GrowthChart';

interface OrgsAnalyticsSectionProps {
  overview: PlatformOverview | null;
}

const OrgsAnalyticsSection = memo(function OrgsAnalyticsSection({ overview }: OrgsAnalyticsSectionProps) {
  const chartData = useMemo(() => buildChartData(overview), [overview]);

  if (!overview || chartData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 sm:px-6 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Branches & Students by Organization</h3>
        </div>
        <div className="p-4 sm:p-5">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} angle={-12} textAnchor="end" height={48} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="Branches" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Students" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Staff" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            {[
              { label: 'Branches', color: CHART_COLORS[0] },
              { label: 'Students', color: CHART_COLORS[2] },
              { label: 'Staff', color: CHART_COLORS[1] },
            ].map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-1">
        <GrowthChart growth={overview.growth} />
      </div>
    </div>
  );
});

export default OrgsAnalyticsSection;
