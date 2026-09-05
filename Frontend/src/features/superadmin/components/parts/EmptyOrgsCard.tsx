'use client';

import { Card, EmptyState } from '@/features/shared/components';
import Link from 'next/link';

interface EmptyOrg {
  id: string;
  name: string;
  code: string;
}

interface EmptyOrgsCardProps {
  orgs: EmptyOrg[];
}

export default function EmptyOrgsCard({ orgs }: EmptyOrgsCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">🟣 Empty Organizations</h3>
      <p className="text-xs text-gray-500 mb-4">Organizations with zero branches.</p>
      {orgs.length === 0 ? (
        <EmptyState
          icon={<svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          title="All clear"
          description="Every organization has at least one branch."
        />
      ) : (
        <>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {orgs.map((org) => (
              <div key={org.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{org.name}</p>
                  <p className="text-xs text-gray-500">{org.code}</p>
                </div>
                <Link href={`/admin/organizations/${org.id}`} className="text-xs text-primary-600 hover:underline">
                  View →
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-gray-100 pt-2">
            <p className="text-xs text-gray-500">{orgs.length} organization(s)</p>
          </div>
        </>
      )}
    </Card>
  );
}
