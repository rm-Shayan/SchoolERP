'use client';

import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { ConfirmDialog } from '@/features/shared/components';
import type { Organization, School } from '@/types';
import BlockReasonDialog from './BlockReasonDialog';

export interface OrgModerationDialogsHandle {
  openBlockOrg: () => void;
  openUnblockOrg: () => void;
  openBlockSchool: (school: School) => void;
  openUnblockSchool: (school: School) => void;
}

interface OrgModerationDialogsProps {
  org: Organization;
  onBlockOrg: (reason?: string) => Promise<boolean>;
  onUnblockOrg: () => Promise<boolean>;
  onBlockSchool: (id: string, reason?: string) => Promise<boolean>;
  onUnblockSchool: (id: string) => Promise<boolean>;
}

const OrgModerationDialogs = forwardRef<OrgModerationDialogsHandle, OrgModerationDialogsProps>(
  function OrgModerationDialogs({ org, onBlockOrg, onUnblockOrg, onBlockSchool, onUnblockSchool }, ref) {
    const [blockOrgOpen, setBlockOrgOpen] = useState(false);
    const [unblockOrgOpen, setUnblockOrgOpen] = useState(false);
    const [blockSchoolTarget, setBlockSchoolTarget] = useState<School | null>(null);
    const [unblockTarget, setUnblockTarget] = useState<School | null>(null);
    const [blocking, setBlocking] = useState(false);
    const [blockOrgReason, setBlockOrgReason] = useState('');
    const [blockSchoolReason, setBlockSchoolReason] = useState('');

    useImperativeHandle(ref, () => ({
      openBlockOrg: () => setBlockOrgOpen(true),
      openUnblockOrg: () => setUnblockOrgOpen(true),
      openBlockSchool: (school) => setBlockSchoolTarget(school),
      openUnblockSchool: (school) => setUnblockTarget(school),
    }));

    const confirmBlockOrg = useCallback(
      async () => {
        setBlocking(true);
        try {
          await onBlockOrg(blockOrgReason.trim() || undefined);
          setBlockOrgOpen(false);
        } finally {
          setBlocking(false);
        }
      },
      [onBlockOrg, blockOrgReason]
    );

    const confirmUnblockOrg = useCallback(async () => {
      setBlocking(true);
      try {
        await onUnblockOrg();
      } finally {
        setBlocking(false);
        setUnblockOrgOpen(false);
      }
    }, [onUnblockOrg]);

    const confirmBlockSchool = useCallback(
      async () => {
        if (!blockSchoolTarget) return;
        setBlocking(true);
        try {
          await onBlockSchool(blockSchoolTarget.id, blockSchoolReason.trim() || undefined);
          setBlockSchoolTarget(null);
        } finally {
          setBlocking(false);
        }
      },
      [blockSchoolTarget, onBlockSchool, blockSchoolReason]
    );

    const confirmUnblockSchool = useCallback(async () => {
      if (!unblockTarget) return;
      setBlocking(true);
      try {
        await onUnblockSchool(unblockTarget.id);
      } finally {
        setBlocking(false);
        setUnblockTarget(null);
      }
    }, [unblockTarget, onUnblockSchool]);

    return (
      <>
        <BlockReasonDialog
          open={blockOrgOpen}
          title="Block organization"
          memberName={org.name}
          message={`Blocking ${org.name} will lock out every branch, admin, staff, student, and parent account. This is reversible.`}
          loading={blocking}
          reasonValue={blockOrgReason}
          onReasonChange={setBlockOrgReason}
          onConfirm={confirmBlockOrg}
          onCancel={() => setBlockOrgOpen(false)}
        />
        <BlockReasonDialog
          open={blockSchoolTarget !== null}
          memberName={blockSchoolTarget?.name}
          title="Block branch"
          message={
            blockSchoolTarget
              ? `Blocking ${blockSchoolTarget.name} will lock out its admin, staff, students, and parents. Other branches keep working.`
              : ''
          }
          loading={blocking}
          reasonValue={blockSchoolReason}
          onReasonChange={setBlockSchoolReason}
          onConfirm={confirmBlockSchool}
          onCancel={() => setBlockSchoolTarget(null)}
        />
        <ConfirmDialog
          open={unblockOrgOpen}
          title="Unblock organization"
          message={`Restore access for ${org.name} and all its branches?`}
          confirmLabel="Unblock"
          variant="primary"
          loading={blocking}
          onConfirm={async () => { await confirmUnblockOrg(); setUnblockOrgOpen(false); }}
          onCancel={() => setUnblockOrgOpen(false)}
        />
        <ConfirmDialog
          open={unblockTarget !== null}
          title="Unblock branch"
          message={unblockTarget ? `Restore access for ${unblockTarget.name}?` : ''}
          confirmLabel="Unblock"
          variant="primary"
          loading={blocking}
          onConfirm={async () => { await confirmUnblockSchool(); setUnblockTarget(null); }}
          onCancel={() => setUnblockTarget(null)}
        />
      </>
    );
  }
);

export default OrgModerationDialogs;
