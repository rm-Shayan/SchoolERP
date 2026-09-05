import type { ReactNode } from 'react';

interface HealthStatCardProps {
  label: string;
  count: number;
  icon: ReactNode;
  color: string;
}

export default function HealthStatCard({ label, count, icon, color }: HealthStatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-extrabold tabular-nums text-gray-900">{count}</p>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}
