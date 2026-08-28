'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { orgService, schoolService } from '@/lib/api';
import type { SchoolAdminAssignResult } from '@/lib/api/schoolService';
import type { Organization, School } from '@/types';
import { ConfirmDialog, SectionHeader, SectionSkeleton, Reveal } from '@/features/shared/components';
import SmtpSettingsSection from '@/features/school/components/parts/SmtpSettingsSection';
import Breadcrumbs from './parts/Breadcrumbs';
import SchoolHeader from './parts/SchoolHeader';
import SchoolStats from './parts/SchoolStats';
import EditSchoolModal from './parts/EditSchoolModal';
import AssignAdminModal from './parts/AssignAdminModal';
import BranchAdminCard from './parts/BranchAdminCard';
import CredentialsBanner from './parts/CredentialsBanner';
import BranchLogoCard from './parts/BranchLogoCard';
import BranchDetailsCard from './parts/BranchDetailsCard';
import BlockReasonDialog from './parts/BlockReasonDialog';
import { useBranchModeration } from './parts/useBranchModeration';

export default function SchoolDetailPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const schoolId = params?.schoolId as string;
  const [org, setOrg] = useState<Organization | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [assignCredentials, setAssignCredentials] = useState<{ email: string; password: string } | null>(null);
  const reloadAll = useCallback(async () => {
    if (!orgId || !schoolId) return;
    try {
      const [orgData, schoolData] = await Promise.all([
        orgService.getById(orgId),
        schoolService.getById(schoolId),
      ]);
      setOrg(orgData);
      setSchool(schoolData);
    } catch { /* keep current data on refresh failures */ }
  }, [orgId, schoolId]);
  useEffect(() => {
    if (!orgId || !schoolId) return;
    reloadAll().finally(() => setLoading(false));
  }, [orgId, schoolId, reloadAll]);
  const {
    deleting, blocking, blockOpen, setBlockOpen, confirmDelete, setConfirmDelete,
    handleDeleteBranch, confirmBlock, confirmUnblock,
  } = useBranchModeration(school, org, reloadAll);
  const handleSchoolSaved = useCallback((updated: School) => { setSchool(updated); setShowEditModal(false); }, []);
  const handleAdminAssigned = useCallback((fresh: School, result: SchoolAdminAssignResult) => {
    setSchool(fresh); setShowAdminModal(false); setAssignCredentials(result.adminCredentials ?? null);
  }, []);
  const handleLogoUpdated = useCallback((updated: School) => setSchool(updated), []);

  if (loading) return <SectionSkeleton />;

  if (!org || !school) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Branch not found</h1>
        <Link href="/admin/organizations" className="inline-flex px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">Back to Organizations</Link>
      </div>
    );
  }

  return (
    <div className="sa-detail-workspace space-y-6">
      <Breadcrumbs items={[
        { label: 'Super Admin' },
        { label: 'Organizations', to: '/admin/organizations' },
        { label: org.name, to: `/admin/organizations/${org.id}` },
        { label: school.name },
      ]} />
      <Reveal>
        <SchoolHeader
          org={org} school={school} deleting={deleting} blocking={blocking}
          onEdit={() => setShowEditModal(true)} onDelete={() => setConfirmDelete(true)}
          onBlock={() => setBlockOpen(true)} onUnblock={confirmUnblock}
        />
      </Reveal>
      <Reveal delay={0.06}>
        <SchoolStats school={school} org={org} />
      </Reveal>
      <div className="sa-section-marker" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Branch management</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="sa-detail-band"><SectionHeader
        title="Students"
        subtitle="View and manage student records for this branch."
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
        action={
          <Link href={`/admin/organizations/${org.id}/schools/${school.id}/students`} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
            Manage Students
          </Link>
        }
      /></div>
      <EditSchoolModal key={`edit-${showEditModal}`} open={showEditModal} school={school} onClose={() => setShowEditModal(false)} onSaved={handleSchoolSaved} />
      {assignCredentials && (
        <Reveal delay={0.1}>
          <CredentialsBanner credentials={assignCredentials} onDismiss={() => setAssignCredentials(null)} />
        </Reveal>
      )}
      <Reveal delay={0.14}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
          <BranchAdminCard school={school} onChangeAdmin={() => setShowAdminModal(true)} />
          <BranchLogoCard school={school} org={org} onLogoUpdated={handleLogoUpdated} />
          <div className="lg:col-span-2"><BranchDetailsCard org={org} school={school} /></div>
        </div>
      </Reveal>
      <div className="sa-section-marker" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Configuration</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <AssignAdminModal key={`admin-${showAdminModal}`} open={showAdminModal} schoolId={school.id} onClose={() => setShowAdminModal(false)} onAssigned={handleAdminAssigned} />
      <div className="sa-detail-band">
        <Reveal delay={0.18}><SmtpSettingsSection organizationId={org.id} schoolId={school.id} /></Reveal>
      </div>
      <BlockReasonDialog open={blockOpen} title="Block branch" message={`Blocking ${school.name} will lock out its admin, staff, students and parents immediately.`} loading={blocking} onConfirm={confirmBlock} onCancel={() => setBlockOpen(false)} />
      <ConfirmDialog open={confirmDelete} title="Delete branch" message={<>This permanently removes <span className="font-medium">{school.name}</span> and all its data (students, fees, attendance, etc.). This action cannot be undone.</>} confirmLabel="Delete" loading={deleting} onConfirm={handleDeleteBranch} onCancel={() => setConfirmDelete(false)} />
    </div>
  );
}
