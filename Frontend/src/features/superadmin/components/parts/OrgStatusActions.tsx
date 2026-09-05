'use client';

import { memo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from 'recharts';
import type { PlatformOverview } from '@/types';
import { cn } from '@/lib/utils';

interface OrgStatusActionsProps {
  stats?: PlatformOverview['stats'];
  orgCount?: number;
}

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#94a3b8'];

const OrgStatusActions = memo(function OrgStatusActions({ stats, orgCount = 0 }: OrgStatusActionsProps) {
  const statuses = [
    { label: 'Active', count: stats?.active ?? 0, color: 'bg-emerald-500', pie: '#10b981' },
    { label: 'Blocked', count: stats?.blocked ?? 0, color: 'bg-rose-500', pie: '#ef4444' },
    { label: 'Partial', count: stats?.partiallyBlocked ?? 0, color: 'bg-amber-500', pie: '#f59e0b' },
    { label: 'Pending', count: stats?.setupPending ?? 0, color: 'bg-slate-400', pie: '#94a3b8' },
  ];
  const total = statuses.reduce((s, x) => s + x.count, 0);
  const pieData = statuses.map((s) => ({ name: s.label, value: s.count }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Status with donut */}
      <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Status Distribution</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={52} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {statuses.map((s) => <Cell key={s.label} fill={s.pie} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} orgs`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statuses.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.pie }} />
                  <span className="text-xs text-gray-600 flex-1">{s.label}</span>
                  <span className="text-xs font-bold text-gray-900">{s.count}</span>
                  <span className="text-[10px] text-gray-400">{total > 0 ? Math.round((s.count / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Organizations</p>
            <p className="text-xl font-extrabold text-gray-900 tabular-nums">{total}</p>
          </div>
        </div>
      </div>

      {/* Revenue insights */}
      <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Revenue Insights</h3>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Total Revenue', value: `Rs ${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-amber-600 bg-amber-50' },
            { label: 'Avg per Org', value: `Rs ${orgCount > 0 ? Math.round((stats?.totalRevenue ?? 0) / orgCount).toLocaleString() : '0'}`, icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', color: 'text-violet-600 bg-violet-50' },
            { label: 'Top Earner', value: 'See leaderboard →', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'text-emerald-600 bg-emerald-50' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', item.color)}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{item.label}</p>
                <p className="text-sm font-bold text-gray-900 truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Create Org', href: '/admin/organizations/new', icon: 'M12 4v16m8-8H4', c: 'bg-violet-50 text-violet-600 hover:bg-violet-100 hover:shadow-sm' },
            { label: 'Import Excel', href: '/admin/import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', c: 'bg-sky-50 text-sky-600 hover:bg-sky-100 hover:shadow-sm' },
            { label: 'View Users', href: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', c: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:shadow-sm' },
            { label: 'Settings', href: '/admin/settings', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', c: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:shadow-sm' },
          ].map((a) => (
            <Link key={a.label} href={a.href} className={cn('flex flex-col items-center gap-2 rounded-xl p-4 transition-all', a.c)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} /></svg>
              <span className="text-xs font-semibold">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
});

export default OrgStatusActions;
