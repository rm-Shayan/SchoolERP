'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/features/shared/components';
import type { ParentProfile } from '@/lib/api/parentService';
import type { PortalStudentProfile } from '@/lib/api/portalService';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { formatDate } from '@/lib/utils';
import { ProfileSkeleton } from './PortalSkeletonsA';
import LinkedChildrenCard from './LinkedChildrenCard';
import ProfileEditForm from './ProfileEditForm';
import ProfileHeroCard from './ProfileHeroCard';
import InfoRow from './PortalInfoRow';

interface PortalSettingsTabProps {
  activeChildId: string;
  onChildChange: (id: string) => void;
}

function readProfile<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

export default function PortalSettingsTab({ activeChildId, onChildChange }: PortalSettingsTabProps) {
  const color = getOrgThemeColor() || '#6366f1';
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [student, setStudent] = useState<PortalStudentProfile | null>(null);
  const [studentMode, setStudentMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const isStudentSession = Boolean(localStorage.getItem('studentToken'));
    setStudentMode(isStudentSession);
    if (isStudentSession) setStudent(readProfile<PortalStudentProfile>('studentProfile'));
    else setParent(readProfile<ParentProfile>('parentProfile'));
    setLoaded(true);
  }, []);

  const handleSaved = useCallback((updated: ParentProfile) => {
    setParent((prev) => {
      const merged = { ...(prev ?? ({} as ParentProfile)), ...updated };
      localStorage.setItem('parentProfile', JSON.stringify(merged));
      return merged;
    });
  }, []);

  if (!loaded) return <ProfileSkeleton />;
  if (!parent && !student) return <ProfileSkeleton />;

  const name = studentMode && student ? `${student.firstName} ${student.lastName}` : parent?.name ?? '';
  const badgeLabel = studentMode && student ? 'Student Account' : 'Parent Account';
  const imageUrl = studentMode ? student?.imageUrl : parent?.imageUrl;
  const meta = studentMode
    ? `${student?.school?.name ?? 'School'} · ${student?.class?.name ?? ''} · Roll #${student?.rollNumber ?? ''}`
    : `${parent?.whatsappNo ?? ''}${parent?.email ? ` · ${parent.email}` : ''}`;
  const memberSince = !studentMode && parent?.createdAt ? `Member since ${formatDate(parent.createdAt)}` : null;
  const children = parent?.children ?? [];

  return (
    <div className="space-y-4">
      <ProfileHeroCard
        name={name}
        badgeLabel={badgeLabel}
        badgeVariant={studentMode ? 'success' : 'info'}
        meta={meta}
        imageUrl={imageUrl}
        color={color}
        memberSince={memberSince}
        canEditPhoto={!studentMode}
        onProfilePhotoUploaded={handleSaved}
      />

      {!studentMode && parent ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="overflow-hidden border-0 shadow-md lg:col-span-2">
              <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-100" />
              <CardContent className="p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <InfoRow label="WhatsApp Number" value={parent.whatsappNo} accent={color} />
                  <InfoRow label="Phone" value={parent.phone} fallback="Not provided" accent={color} />
                  <InfoRow label="Email" value={parent.email} fallback="Not provided" accent={color} />
                  <InfoRow label="Member Since" value={parent.createdAt ? formatDate(parent.createdAt) : '—'} accent={color} />
                </div>
              </CardContent>
            </Card>
            <LinkedChildrenCard children={children} activeChildId={activeChildId} onChildChange={onChildChange} />
          </div>

          <ProfileEditForm key={parent.id} parent={parent} onSaved={handleSaved} />
        </>
      ) : (
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-100" />
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow label="Roll Number" value={student?.rollNumber} accent={color} />
              <InfoRow label="School" value={student?.school?.name} accent={color} />
              <InfoRow label="Class" value={student?.class?.name} accent={color} />
              <InfoRow label="Section" value={student?.section?.name} accent={color} />
              <InfoRow label="Parent WhatsApp" value={student?.parentWhatsapp} fallback="—" accent={color} />
              <InfoRow label="Status" value={student?.status?.replace('_', ' ')} accent={color} />
            </div>
          </CardContent>
        </Card>
      )}

      {studentMode && (
        <Card>
          <CardContent className="p-5 text-sm text-gray-500">
            Student profile details are managed by the school. Roll number, class and section are updated by your school admin.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
