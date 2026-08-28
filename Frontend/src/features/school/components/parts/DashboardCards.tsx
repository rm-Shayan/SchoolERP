'use client';

import type { AdmissionFunnelStats } from '@/lib/api/admissionService';
import { Card, CardHeader, CardContent, Badge } from '@/features/shared/components';

export function Icon({ d }: { d: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

function CardShimmer() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[1px] rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-400">Loading…</span>
      </div>
    </div>
  );
}

export function FunnelCard({ funnel, loading }: { funnel: AdmissionFunnelStats | null; loading?: boolean }) {
  const stages = Object.entries(funnel ?? {}).filter(([k]) => k !== 'total');
  const maxVal = Math.max(...stages.map(([, v]) => v as number), 1);
  return (
    <Card className="lg:col-span-6 relative flex flex-col min-h-[260px] sm:min-h-[320px]">
      {loading && !funnel && <CardShimmer />}
      <CardHeader className="flex items-center justify-between py-4">
        <h2 className="font-extrabold text-slate-900 tracking-tight">Admission Funnel</h2>
        <Badge variant="info">Pipeline</Badge>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center py-4">
        {!funnel ? (
          <p className="text-sm text-slate-400 py-6 text-center">No funnel data available</p>
        ) : (
          <div className="space-y-3.5">
            {stages.map(([stage, count]) => {
              const val = count as number;
              const pct = Math.round((val / maxVal) * 100);
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="capitalize">{stage.replace(/_/g, ' ').toLowerCase()}</span>
                    <span className="text-slate-900">{val} applicants</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-sm font-bold text-slate-900">
              <span>Total applicants</span>
              <Badge variant="info">{funnel.total}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
