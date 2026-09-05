'use client';

import { memo, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import type { PlatformOverview } from '@/types';
import { buildChartData, CHART_COLORS } from './helpers';

interface OrgChartsSectionProps {
  overview: PlatformOverview | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-bold text-gray-900 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-[11px] text-gray-600">
          <span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-bold text-gray-900">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const OrgChartsSection = memo(function OrgChartsSection({ overview }: OrgChartsSectionProps) {
  const chartData = useMemo(() => buildChartData(overview), [overview]);
  const growth = overview?.growth ?? [];

  if (!overview) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Bar Chart — 2 cols */}
      {chartData.length > 0 && (
        <div className="lg:col-span-2 rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Branches & Students by Organization</h3>
            <div className="flex items-center gap-4">
              {[
                { label: 'Branches', color: CHART_COLORS[0] },
                { label: 'Students', color: CHART_COLORS[2] },
                { label: 'Staff', color: CHART_COLORS[1] },
              ].map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} angle={-12} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Branches" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Students" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Staff" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Growth Area Chart — 1 col */}
      <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Organization Growth</h3>
          <p className="text-[11px] text-gray-400">New orgs per month (12 months)</p>
        </div>
        <div className="p-4">
          {growth.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growth} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="New orgs" stroke="#7c3aed" strokeWidth={2.5}
                  fill="url(#growthFill)" dot={{ r: 3, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
});

export default OrgChartsSection;
