'use client';

import { memo, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import type { School } from '@/types';

interface BranchAnalyticsProps {
  schools: School[];
}

const COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

const BranchAnalytics = memo(function BranchAnalytics({ schools }: BranchAnalyticsProps) {
  const byOrg = useMemo(() => {
    const map = new Map<string, { name: string; branches: number; students: number; staff: number }>();
    schools.forEach((s) => {
      const key = s.organizationId || 'unknown';
      const existing = map.get(key) || { name: s.organization?.name ?? 'Unknown', branches: 0, students: 0, staff: 0 };
      existing.branches += 1;
      existing.students += s._count?.students ?? 0;
      existing.staff += s._count?.users ?? 0;
      map.set(key, existing);
    });
    return [...map.values()].sort((a, b) => b.branches - a.branches);
  }, [schools]);

  const statusDist = useMemo(() => [
    { name: 'Active', value: schools.filter((s) => s.status === 'ACTIVE').length, color: '#10b981' },
    { name: 'Blocked', value: schools.filter((s) => s.status === 'BLOCKED').length, color: '#ef4444' },
  ], [schools]);

  const barData = useMemo(() => [...schools]
    .sort((a, b) => (b._count?.students ?? 0) - (a._count?.students ?? 0))
    .slice(0, 8)
    .map((s) => ({ name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name, Students: s._count?.students ?? 0, Staff: s._count?.users ?? 0 })),
  [schools]);

  return (
    <div className="space-y-4">
      {barData.length > 0 && (
        <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Students & Staff by Branch</h3>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2 h-2 rounded-sm bg-[#7c3aed]" />Students</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2 h-2 rounded-sm bg-[#f59e0b]" />Staff</span>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={16} angle={-12} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Students" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Staff" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Branches by Organization</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['Organization', 'Branches', 'Students', 'Staff'].map((h) => (
                    <th key={h} className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${h !== 'Organization' ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byOrg.map((org) => (
                  <tr key={org.name} className="hover:bg-violet-50/30 transition-colors">
                    <td className="px-5 py-2.5 text-xs font-semibold text-gray-900">{org.name}</td>
                    <td className="px-5 py-2.5 text-center"><span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-50 text-xs font-bold text-violet-700">{org.branches}</span></td>
                    <td className="px-5 py-2.5 text-center"><span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">{org.students}</span></td>
                    <td className="px-5 py-2.5 text-center"><span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-sky-50 text-xs font-bold text-sky-700">{org.staff}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Status</h3>
          </div>
          <div className="p-5 flex flex-col items-center">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {statusDist.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center gap-4">
              {statusDist.map((s) => (
                <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />{s.name}: {s.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default BranchAnalytics;
