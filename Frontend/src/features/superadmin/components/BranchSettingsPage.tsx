'use client';

import { useCallback, useEffect, useState } from 'react';
import { schoolService, orgService } from '@/lib/api';
import type { School, Organization } from '@/types';
import { Card, PageHeader, Badge, EmptyState } from '@/features/shared/components';
import BranchSettingsCard from './parts/BranchSettingsCard';

export default function BranchSettingsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgData, schoolData] = await Promise.all([
        orgService.getAll(),
        schoolService.getAll(),
      ]);
      setOrgs(orgData);
      setSchools(schoolData);
    } catch (err) {
      console.error('Failed to load branch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = selectedOrg === 'ALL'
    ? schools
    : schools.filter((s) => s.organizationId === selectedOrg);

  const getOrgName = (orgId: string) => orgs.find((o) => o.id === orgId)?.name ?? '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Email & Storage Settings"
        description="SMTP and Cloudinary configuration for all branches across organizations."
      />

      {/* Org filter */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setSelectedOrg('ALL')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedOrg === 'ALL' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All Organizations
        </button>
        {orgs.map((org) => (
          <button
            key={org.id}
            onClick={() => setSelectedOrg(org.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedOrg === org.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {org.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            title="No branches found"
            description="Create an organization and branch first."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((school) => (
            <BranchSettingsCard
              key={school.id}
              school={school}
              orgName={getOrgName(school.organizationId)}
              onUpdated={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
