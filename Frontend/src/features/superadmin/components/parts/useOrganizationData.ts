'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orgService, schoolService } from '@/lib/api';
import { dedupRequest } from '@/lib/utils/requestDedup';
import type { Organization, School } from '@/types';
import { downloadBlob } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { EditOrgFormValues } from './helpers';
import { orgUpdatePayload } from './helpers';
import type { BranchFormValues } from './branchForm';
import { branchCreatePayload } from './branchForm';
import { takePrefetchedOrganization } from './orgPrefetch';
const errMsg = (err: any, fallback: string) => err?.response?.data?.message || err?.message || fallback;

export function useOrganizationData(id: string | undefined) {
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [branchCredentials, setBranchCredentials] = useState<{ email: string; password: string } | null>(null);
  const fetchOrgAndSchools = useCallback(async () => {
    if (!id) return;
    const p = takePrefetchedOrganization(id);
    const [orgData, schoolsData] = await Promise.all([
      p?.org ?? orgService.getById(id),
      p?.schools ?? schoolService.getAll(id),
    ]);
    setOrg(orgData);
    setSchools(schoolsData);
    localStorage.setItem('organization', JSON.stringify(orgData));
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        await fetchOrgAndSchools();
      } catch {
        toast.error('Failed to load organization');
        router.push('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchOrgAndSchools, router]);
  const reload = useCallback(async () => {
    try {
      await fetchOrgAndSchools();
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to reload organization'));
    }
  }, [fetchOrgAndSchools]);

  const handleExportBranches = useCallback(async () => {
    if (!id) return;
    setExporting(true);
    try {
      const blob = await schoolService.exportExcel(id);
      downloadBlob(blob, `branches-${org?.code ?? 'org'}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Branches exported');
    } catch (err: any) {
      toast.error(errMsg(err, 'Export failed'));
    } finally {
      setExporting(false);
    }
  }, [id, org]);

  const handleDeleteOrg = useCallback(async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await dedupRequest(`delete-org-${id}`, () => orgService.remove(id));
      toast.success('Organization deleted');
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to delete'));
    } finally {
      setDeleting(false);
    }
  }, [id, router]);

  const handleDeleteSchool = useCallback(async (schoolId: string) => {
    setDeletingSchoolId(schoolId);
    try {
      await dedupRequest(`delete-school-${schoolId}`, () => schoolService.remove(schoolId));
      setSchools((prev) => prev.filter((s) => s.id !== schoolId));
      toast.success('Branch deleted');
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to delete branch'));
    } finally {
      setDeletingSchoolId(null);
    }
  }, []);

  const handleCreateSchool = useCallback(async (values: BranchFormValues) => {
    if (!id) return false;
    try {
      const result = await schoolService.create(branchCreatePayload(values, id));
      setSchools((prev) => [...prev, result.school]);
      if (result.adminCredentials) {
        setBranchCredentials(result.adminCredentials);
        toast.success('Branch created! Admin credentials emailed.');
      } else {
        toast.success(result.admin ? `Branch created! Managed by ${result.admin.name}.` : 'Branch created successfully!');
      }
      return true;

    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to create branch'));
      return false;
    }
  }, [id]);

  const handleEditOrg = useCallback(async (values: EditOrgFormValues) => {
    if (!id || !org) return false;
    try {
      const updated = await orgService.update(id, orgUpdatePayload(values));
      setOrg({ ...org, ...updated });
      localStorage.setItem('organization', JSON.stringify({ ...org, ...updated }));
      toast.success('Organization updated');
      return true;
    } catch (err: any) {
      toast.error(errMsg(err, 'Failed to update organization'));
      return false;
    }
  }, [id, org]);
  return {
    org,
    schools,
    loading,
deleting,
    deletingSchoolId,
    exporting,
    branchCredentials,
    setBranchCredentials,
    reload,
    handleExportBranches,
    handleDeleteOrg,
    handleDeleteSchool,
    handleCreateSchool,
    handleEditOrg,
  };
}
