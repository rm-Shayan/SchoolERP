'use client';

import { useCallback, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { ConfirmDialog, SectionSkeleton, Reveal } from '@/features/shared/components';
import SmtpSettingsSection from '@/features/school/components/parts/SmtpSettingsSection';
import Breadcrumbs from './parts/Breadcrumbs';
import OrgHeader from './parts/OrgHeader';
import OrgStats from './parts/OrgStats';
import CredentialsBanner from './parts/CredentialsBanner';
import SchoolsSection from './parts/SchoolsSection';
import EditOrgModal from './parts/EditOrgModal';
import AddBranchModal from './parts/AddBranchModal';
import OrgDashboardSection from './parts/OrgDashboardSection';
import OrgModerationDialogs, { type OrgModerationDialogsHandle } from './parts/OrgModerationDialogs';
import { useOrganizationData } from './parts/useOrganizationData';
import { useOrganizationModeration } from './parts/useOrganizationModeration';

export default function OrganizationDetail() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const moderationRef = useRef<OrgModerationDialogsHandle>(null);
  const {
    org,
    schools,
    loading,
    exporting,
    branchCredentials,
    setBranchCredentials,
    handleExportBranches,
    handleDeleteOrg,
    handleDeleteSchool,
    handleCreateSchool,
    handleEditOrg,
    reload,
  } = useOrganizationData(orgId);

  const { handleBlockOrg, handleUnblockOrg, handleBlockSchool, handleUnblockSchool } =
    useOrganizationModeration({ id: orgId, reload });

  const openEdit = useCallback(() => setShowEditModal(true), []);
  const closeEdit = useCallback(() => setShowEditModal(false), []);
  const openAdd = useCallback(() => setShowSchoolModal(true), []);
  const closeAdd = useCallback(() => setShowSchoolModal(false), []);
  const dismissCredentials = useCallback(() => setBranchCredentials(null), [setBranchCredentials]);
  const openDeleteConfirm = useCallback(() => setConfirmDelete(true), []);
  const closeDeleteConfirm = useCallback(() => setConfirmDelete(false), []);

  const confirmDeleteOrg = useCallback(async () => {
    setDeleting(true);
    await handleDeleteOrg();
    setDeleting(false);
  }, [handleDeleteOrg]);

  if (loading) {
    return <SectionSkeleton />;
  }

  if (!org) return null;

  return (
    <div className="sa-detail-workspace space-y-6 sm:space-y-7">
      <Breadcrumbs
        items={[
          { label: 'Super Admin' },
          { label: 'Organizations', to: '/admin/organizations' },
          { label: org.name },
        ]}
      />
      <Reveal>
        <OrgHeader
          org={org}
          deleting={deleting}
          blocking={false}
          onEdit={openEdit}
          onDelete={openDeleteConfirm}
          onBlock={() => moderationRef.current?.openBlockOrg()}
          onUnblock={() => moderationRef.current?.openUnblockOrg()}
        />
      </Reveal>
      <Reveal delay={0.06}>
        <OrgStats org={org} branchCount={schools.length} />
      </Reveal>
      {branchCredentials && (
        <Reveal delay={0.1}>
          <CredentialsBanner credentials={branchCredentials} onDismiss={dismissCredentials} />
        </Reveal>
      )}
      <div className="sa-detail-band">
        <Reveal delay={0.14}><OrgDashboardSection organizationId={org.id} /></Reveal>
      </div>
      <div className="sa-detail-band">
        <Reveal delay={0.18}><SmtpSettingsSection organizationId={org.id} /></Reveal>
      </div>
      <Reveal delay={0.22}>
        <div className="sa-detail-band">
        <SchoolsSection
          org={org}
          schools={schools}
          exporting={exporting}
          onExport={handleExportBranches}
          onAdd={openAdd}
          onDeleteSchool={handleDeleteSchool}
          onBlockSchool={(school) => moderationRef.current?.openBlockSchool(school)}
          onUnblockSchool={(school) => moderationRef.current?.openUnblockSchool(school)}
        />
        </div>
      </Reveal>
      <EditOrgModal open={showEditModal} org={org} onClose={closeEdit} onSave={handleEditOrg} />
      <AddBranchModal open={showSchoolModal} onClose={closeAdd} onCreate={handleCreateSchool} />
      <OrgModerationDialogs
        ref={moderationRef}
        org={org}
        onBlockOrg={handleBlockOrg}
        onUnblockOrg={handleUnblockOrg}
        onBlockSchool={handleBlockSchool}
        onUnblockSchool={handleUnblockSchool}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete organization"
        message={
          <>
            This permanently removes <span className="font-medium">{org.name}</span>, all its branches, and all related data (students, staff, fees, attendance, exams, etc.). This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDeleteOrg}
        onCancel={closeDeleteConfirm}
      />
    </div>
  );
}
