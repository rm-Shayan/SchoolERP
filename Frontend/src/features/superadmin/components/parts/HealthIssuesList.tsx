'use client';

import { Card, EmptyState } from '@/features/shared/components';
import type { HealthBranch } from '@/lib/api/orgService';

interface HealthIssuesListProps {
  title: string;
  description: string;
  items: HealthBranch[];
  renderExtra?: (item: HealthBranch) => React.ReactNode;
}

export default function HealthIssuesList({ title, description, items, renderExtra }: HealthIssuesListProps) {
  if (items.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-4">{description}</p>
        <EmptyState
          icon={<svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          title="All clear"
          description="No issues found in this category."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.code} · {item.organization?.name ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.blockedReason && (
                  <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{item.blockedReason}</span>
                )}
                {renderExtra?.(item)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500">{items.length} item(s)</p>
      </div>
    </Card>
  );
}
