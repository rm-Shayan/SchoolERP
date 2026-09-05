'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/features/shared/components';
import { orgService, schoolService } from '@/lib/api';
import type { Organization, School } from '@/types';

interface OrgBranchFilterProps {
  organizationId: string;
  schoolId: string;
  onOrgChange: (orgId: string) => void;
  onBranchChange: (schoolId: string) => void;
}

export default function OrgBranchFilter({
  organizationId,
  schoolId,
  onOrgChange,
  onBranchChange,
}: OrgBranchFilterProps) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<School[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    orgService
      .getAll()
      .then(setOrgs)
      .catch(() => {})
      .finally(() => setLoadingOrgs(false));
  }, []);

  useEffect(() => {
    if (!organizationId) {
      setBranches([]);
      return;
    }
    setLoadingBranches(true);
    schoolService
      .getAll(organizationId)
      .then(setBranches)
      .catch(() => {})
      .finally(() => setLoadingBranches(false));
  }, [organizationId]);

  const handleOrgChange = (val: string) => {
    onOrgChange(val);
    onBranchChange('');
  };

  return (
    <>
      <div className="w-full sm:w-48">
        <Select
          label="Organization"
          value={organizationId}
          onChange={(e) => handleOrgChange(e.target.value)}
          placeholder="All orgs"
          loading={loadingOrgs}
          options={orgs.map((o) => ({ value: o.id, label: o.name }))}
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          label="Branch"
          value={schoolId}
          onChange={(e) => onBranchChange(e.target.value)}
          placeholder={organizationId ? 'All branches' : 'Select org first'}
          loading={loadingBranches}
          disabled={!organizationId}
          options={branches.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>
    </>
  );
}
