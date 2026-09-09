'use client';

import { useState, useEffect, memo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { feeService } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { formatCurrency } from '@/lib/utils';

interface MonthData {
  month: string;
  label: string;
  collected: number;
  outstanding: number;
  total: number;
}

const axisTick = { fontSize: 11, fill: '#64748b' };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-bold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-bold text-gray-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ChartShimmer() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[1px] rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-400">Loading trend data…</span>
      </div>
    </div>
  );
}

export const FeeTrendChart = memo(function FeeTrendChart({ themeColor }: { themeColor?: string | null }) {
  const { school } = useAppSelector((s) => s.auth);
  const schoolId = school?.id;
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const tc = themeColor || '#6366f1';

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;

    async function load() {
      const now = new Date();
      const monthInputs = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { d, m: d.getMonth() + 1, y: d.getFullYear() };
      });
      const results = await Promise.allSettled(
        monthInputs.map(({ m, y }) => feeService.getSummary({ schoolId: schoolId!, month: m, year: y })),
      );
      const months = results.map((r, i) => {
        const { d, m, y } = monthInputs[i];
        const key = `${y}-${String(m).padStart(2, '0')}`;
        const label = d.toLocaleString('en-PK', { month: 'short', year: '2-digit' });
        if (r.status === 'fulfilled') return { month: key, label, collected: r.value.collected, outstanding: r.value.outstanding, total: r.value.total };
        return { month: key, label, collected: 0, outstanding: 0, total: 0 };
      });
      if (!cancelled) { setData(months); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [schoolId]);

  return (
    <div className="relative rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
      {loading && <ChartShimmer />}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm" style={{ background: tc }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Monthly Fee Trend</h3>
            <p className="text-[11px] text-slate-400">Collected vs outstanding over 6 months</p>
          </div>
        </div>
      </div>
      <div className="px-2 pt-3 pb-2">
        {data.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">No fee data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOutstanding" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" strokeWidth={2.5} fill="url(#gradCollected)" dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="outstanding" name="Outstanding" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradOutstanding)" dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
