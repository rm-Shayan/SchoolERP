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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from '@/features/shared/components';
import type { ClassAttendanceDatum, FeeStatusDatum } from '../../hooks/useDashboardData';

const MAX_LABEL = 12;
const truncate = (s: string) => (s.length > MAX_LABEL ? s.slice(0, MAX_LABEL) + '…' : s);

const axisTick = { fontSize: 11, fill: '#64748b' };

const TruncatedTick = (props: { x?: string | number; y?: string | number; payload?: { value: string } }) => {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const label = truncate(props.payload?.value ?? '');
  return (
    <text x={x} y={y} dy={6} textAnchor="end" transform="rotate(-35)" className="text-[11px]" fill="#64748b">
      {label}
    </text>
  );
};

function ChartShimmer() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[1px] rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-400">Loading chart data…</span>
      </div>
    </div>
  );
}

export const AttendanceChart = memo(function AttendanceChart({ data, loading }: { data: ClassAttendanceDatum[]; loading?: boolean }) {
  return (
    <Card className="lg:col-span-7 relative flex flex-col min-h-[260px] sm:min-h-[320px]">
      {loading && data.length === 0 && <ChartShimmer />}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100/80">
        <h2 className="font-extrabold text-slate-900 tracking-tight">Attendance This Month</h2>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Per class</span>
      </div>
      <div className="flex-1 px-4 pt-2 pb-2">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[220px] text-sm text-slate-400">No attendance data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={TruncatedTick} interval={0} height={60} />
              <YAxis tick={axisTick} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Present" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Late" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
});

export const FeeStatusPie = memo(function FeeStatusPie({ data, loading }: { data: FeeStatusDatum[]; loading?: boolean }) {
  const total = data.reduce((t, d) => t + d.value, 0);
  return (
    <Card className="lg:col-span-5 relative flex flex-col min-h-[260px] sm:min-h-[320px] overflow-hidden">
      {loading && data.length === 0 && <ChartShimmer />}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100/80">
        <h2 className="font-extrabold text-slate-900 tracking-tight">Fee Status</h2>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{total} records</span>
      </div>
      <div className="flex-1 px-4 pt-2">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[220px] text-sm text-slate-400">No fee records yet</div>
        ) : (
          <div className="relative h-full">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip formatter={(value, name) => [`${value} records`, String(name)]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
              <p className="text-xl font-extrabold text-slate-900 tabular-nums">{total}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});
