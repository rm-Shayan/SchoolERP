'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { orgService, type PlatformHealthData } from '@/lib/api/orgService';
import { Button, Card, EmptyState } from '@/features/shared/components';
import type { Organization } from '@/types';
import toast from 'react-hot-toast';
import Breadcrumbs from './parts/Breadcrumbs';
import HealthSkeleton from './parts/HealthSkeleton';
import OrgHealthCard from './parts/OrgHealthCard';
import HealthOrgDetail from './parts/HealthOrgDetail';
import HealthBanner from './parts/HealthBanner';

export default function SchoolHealthDashboard() {
  const [data, setData] = useState<PlatformHealthData | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [health, orgList] = await Promise.all([orgService.getHealth(), orgService.getAll()]);
      setData(health);
      setOrgs(orgList);
    } catch {
      toast.error('Failed to load school health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const orgIssueMap = useMemo(() => {
    if (!data) return new Map<string, { blocked: number; noAdmin: number; noStaff: number }>();
    const map = new Map<string, { blocked: number; noAdmin: number; noStaff: number }>();
    const bump = (orgId: string, key: 'blocked' | 'noAdmin' | 'noStaff') => {
      const cur = map.get(orgId) || { blocked: 0, noAdmin: 0, noStaff: 0 };
      cur[key]++;
      map.set(orgId, cur);
    };
    data.blocked.forEach((b) => { if (b.organization?.id) bump(b.organization.id, 'blocked'); });
    data.noAdmin.forEach((b) => { if (b.organization?.id) bump(b.organization.id, 'noAdmin'); });
    data.noStaff.forEach((b) => { if (b.organization?.id) bump(b.organization.id, 'noStaff'); });
    return map;
  }, [data]);

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);
  const globalIssues = (data?.blocked.length ?? 0) + (data?.noAdmin.length ?? 0) + (data?.noStaff.length ?? 0) + (data?.emptyOrgs.length ?? 0);

  if (loading) return <HealthSkeleton />;

  // Single org detail view
  if (selectedOrgId && selectedOrg && data) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Super Admin' }, { label: 'School Health', to: '/admin/health' }, { label: selectedOrg.name }]} />
        <HealthOrgDetail org={selectedOrg} data={data} onBack={() => setSelectedOrgId(null)} onRefresh={load} loading={loading} />
      </div>
    );
  }

  // Org overview
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Super Admin' }, { label: 'School Health' }]} />
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load} loading={loading}>Refresh</Button>
      </div>
      <HealthBanner
        title="School Health"
        subtitle={`${orgs.length} organization${orgs.length === 1 ? '' : 's'} · ${globalIssues === 0 ? 'All healthy' : `${globalIssues} issue(s) across platform`}`}
        totalIssues={globalIssues}
        totalBranches={orgs.reduce((sum, o) => sum + (o._count?.branches ?? 0), 0)}
        healthyCount={orgs.reduce((sum, o) => {
          const issues = orgIssueMap.get(o.id);
          const total = o._count?.branches ?? 0;
          const orgIssues = (issues?.blocked ?? 0) + (issues?.noAdmin ?? 0) + (issues?.noStaff ?? 0);
          return sum + (total - orgIssues);
        }, 0)}
      />

      {orgs.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState title="No organizations found" description="Create an organization to get started." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orgs.map((org) => {
            const issues = orgIssueMap.get(org.id) || { blocked: 0, noAdmin: 0, noStaff: 0 };
            return (
              <OrgHealthCard
                key={org.id}
                org={org}
                blocked={issues.blocked}
                noAdmin={issues.noAdmin}
                noStaff={issues.noStaff}
                totalBranches={org._count?.branches ?? 0}
                onClick={() => setSelectedOrgId(org.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
