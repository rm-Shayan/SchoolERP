'use client';

import { useEffect, useState } from 'react';
import { Modal, Select, Button } from '@/features/shared/components';
import { staffService, orgService, schoolService } from '@/lib/api';
import { useForm, required } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Organization, School } from '@/types';

interface Props {
  open: boolean;
  adminId: string;
  adminName: string;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignBranchModal({ open, adminId, adminName, onClose, onAssigned }: Props) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOrgsLoading(true);
    orgService.getAll().then(setOrgs).catch(() => toast.error('Failed to load organizations')).finally(() => setOrgsLoading(false));
  }, [open]);

  const { values, errors, isSubmitting, handleChange, handleSubmit, setValue } = useForm({
    initialValues: { organizationId: '', schoolId: '' },
    validators: {
      organizationId: required('Organization is required'),
      schoolId: required('Branch is required'),
    },
    onSubmit: async (v) => {
      try {
        const result = await staffService.assignToBranch(adminId, v.schoolId as string);
        if (result.replacedAdmin) {
          toast.success(`${adminName} assigned. Previous admin (${result.replacedAdmin.name}) was deactivated.`);
        } else {
          toast.success(`${adminName} assigned to branch successfully`);
        }
        onAssigned();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to assign');
      }
    },
  });

  useEffect(() => {
    const orgId = values.organizationId as string;
    if (!orgId) { setSchools([]); return; }
    setSchoolsLoading(true);
    schoolService.getAll(orgId).then(setSchools).catch(() => setSchools([])).finally(() => setSchoolsLoading(false));
    setValue('schoolId', '');
  }, [values.organizationId, setValue]);

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${adminName} to Branch`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-primary-50 border border-primary-200 p-3">
          <p className="text-xs text-primary-700">
            If a branch already has an admin assigned, they will be automatically deactivated and the new admin will be assigned.
          </p>
        </div>
        <Select label="Organization" name="organizationId"
          placeholder={orgsLoading ? 'Loading…' : 'Select organization'}
          options={orgs.map((o) => ({ value: o.id, label: o.name }))}
          value={values.organizationId as string} onChange={handleChange} error={errors.organizationId} />
        <Select label="Branch" name="schoolId"
          placeholder={!values.organizationId ? 'Select org first' : schoolsLoading ? 'Loading…' : 'Select branch'}
          options={schools.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
          value={values.schoolId as string} onChange={handleChange}
          error={errors.schoolId} disabled={!values.organizationId} />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Assign</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
