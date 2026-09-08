'use client';

import { useEffect, useState } from 'react';
import { Button, Card, EmptyState } from '@/features/shared/components';
import { schoolService } from '@/lib/api';
import type { Organization, School } from '@/types';
import type { PlatformHealthData, HealthBranch } from '@/lib/api/orgService';
import HealthStatCard from './HealthStatCard';
import HealthBanner from './HealthBanner';
import Logo from '@/features/shared/components/Logo';
import Link from 'next/link';

interface HealthOrgDetailProps {
  org: Organization;
  data: PlatformHealthData;
  onBack: () => void;
  onRefresh: () => void;
  loading: boolean;
}

type BranchHealth = {
  school: School;
  issues: string[];
};

export default function HealthOrgDetail({ org, data, onBack, onRefresh, loading }: HealthOrgDetailProps) {
  const [branches, setBranches] = useState<School[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  useEffect(() => {
    setBranchesLoading(true);
    schoolService.getAll(org.id)
      .then(setBranches)
      .catch(() => setBranches([]))
      .finally(() => setBranchesLoading(false));
  }, [org.id]);

  // Build issue maps from health data
  const hasOrg = (i: { organization?: { id: string } }) => i.organization?.id === org.id;
  const blocked = data.blocked.filter(hasOrg);
  const noAdmin = data.noAdmin.filter(hasOrg);
  const noStaff = data.noStaff.filter(hasOrg);
  const blockedIds = new Set(blocked.map((b) => b.id));
  const noAdminIds = new Set(noAdmin.map((b) => b.id));
  const noStaffIds = new Set(noStaff.map((b) => b.id));

  const branchHealthList: BranchHealth[] = branches.map((school) => {
    const issues: string[] = [];
    if (school.status === 'BLOCKED') issues.push('Blocked');
    if (blockedIds.has(school.id)) issues.push('Blocked');
    if (noAdminIds.has(school.id)) issues.push('No Admin');
    if (noStaffIds.has(school.id)) issues.push('Zero Staff');
    return { school, issues };
  });

  const healthy = branchHealthList.filter((b) => b.issues.length === 0);
  const unhealthy = branchHealthList.filter((b) => b.issues.length > 0);
  const totalIssues = blocked.length + noAdmin.length + noStaff.length;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        All Organizations
      </button>
      <HealthBanner
        org={org}
        title={org.name}
        subtitle={`${branches.length} branch${branches.length === 1 ? '' : 'es'} · ${totalIssues === 0 ? 'All healthy' : `${totalIssues} issue(s)`}`}
        totalIssues={totalIssues}
        totalBranches={branches.length}
        healthyCount={healthy.length}
      />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh} loading={loading}>Refresh</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthStatCard label="Total Branches" count={branches.length} color="bg-primary-50" icon={<svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
        <HealthStatCard label="Healthy" count={healthy.length} color="bg-green-50" icon={<svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <HealthStatCard label="Blocked" count={blocked.length} color="bg-red-50" icon={<svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
        <HealthStatCard label="Issues" count={noAdmin.length + noStaff.length} color="bg-amber-50" icon={<svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>} />
      </div>

      {branchesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : branches.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState title="No branches" description="This organization has no branches yet." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Branches</h3>
            <p className="text-xs text-gray-500 mt-0.5">{branches.length} branch{branches.length === 1 ? '' : 'es'} · {healthy.length} healthy · {unhealthy.length} with issues</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {unhealthy.map(({ school, issues }) => (
              <BranchRow key={school.id} school={school} issues={issues} />
            ))}
            {healthy.map(({ school }) => (
              <BranchRow key={school.id} school={school} issues={[]} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function BranchRow({ school, issues }: { school: School; issues: string[] }) {
  const hasIssues = issues.length > 0;
  return (
    <div className={`px-4 py-3 flex items-center justify-between transition-colors ${hasIssues ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-gray-50/50'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Logo src={school.logoUrl || school.organization?.logoUrl} name={school.name} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{school.name}</p>
          <p className="text-xs text-gray-500">{school.code}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hasIssues ? (
          <div className="flex flex-wrap gap-1 justify-end">
            {issues.map((issue) => (
              <span key={issue} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                issue === 'Blocked' ? 'bg-red-100 text-red-700' :
                issue === 'No Admin' ? 'bg-amber-100 text-amber-700' :
                'bg-orange-100 text-orange-700'
              }`}>{issue}</span>
            ))}
          </div>
        ) : (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Healthy</span>
        )}
        <Link href={`/admin/organizations/${school.organizationId}/schools/${school.id}`} className="text-xs text-primary-600 hover:underline ml-2">
          View →
        </Link>
      </div>
    </div>
  );
}
