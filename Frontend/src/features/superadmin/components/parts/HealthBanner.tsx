'use client';

import type { Organization } from '@/types';
import Logo from '@/features/shared/components/Logo';

interface HealthBannerProps {
  org?: Organization | null;
  totalIssues: number;
  totalBranches?: number;
  healthyCount?: number;
  title: string;
  subtitle: string;
}

export default function HealthBanner({ org, totalIssues, totalBranches, healthyCount, title, subtitle }: HealthBannerProps) {
  const isHealthy = totalIssues === 0;
  const bgColor = '#6d28d9';

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="relative h-28 sm:h-36" style={{ backgroundColor: bgColor }}>
        {/* Health status badge */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg ${
            isHealthy ? 'bg-green-500 text-white' : 'bg-amber-400 text-amber-900'
          }`}>
            {isHealthy ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                All Healthy
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                {totalIssues} Issue{totalIssues === 1 ? '' : 's'}
              </>
            )}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-7 pb-5 -mt-10 relative">
        <div className="flex items-end gap-4">
          {org && (
            <div className="shrink-0 rounded-2xl bg-white p-2 shadow-xl ring-4 ring-white/60">
              <Logo src={org.logoUrl} name={org.name} size="lg" />
            </div>
          )}
          <div className="min-w-0 pb-1">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight truncate">{title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {totalBranches !== undefined && (
                <Chip label="Branches" value={String(totalBranches)} />
              )}
              {healthyCount !== undefined && totalBranches !== undefined && (
                <Chip label="Healthy" value={`${healthyCount}/${totalBranches}`} green />
              )}
              {org?.code && <Chip label="Code" value={org.code} />}
              {org?.slug && <Chip label="Slug" value={`/o/${org.slug}`} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1 ${
      green ? 'text-green-600 bg-green-50 border-green-100' : 'text-gray-500 bg-gray-50 border-gray-100'
    }`}>
      <span className={green ? 'text-green-400' : 'text-gray-400'}>{label}</span>
      <span className={`font-medium truncate max-w-[160px] ${green ? 'text-green-700' : 'text-gray-700'}`}>{value}</span>
    </span>
  );
}
