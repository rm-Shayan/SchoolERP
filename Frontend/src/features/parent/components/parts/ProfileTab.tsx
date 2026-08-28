'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/features/shared/components';
import type { ParentProfile } from '@/lib/api/parentService';
import type { PortalStudentProfile } from '@/lib/api/portalService';
import { formatDate } from '@/lib/utils';
import { getOrgThemeColor } from '@/lib/utils/orgTheme';
import { ProfileSkeleton } from './PortalSkeletonsA';

type ProfileData = { type: 'parent'; data: ParentProfile } | { type: 'student'; data: PortalStudentProfile };

export default function ProfileTab() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentRaw = localStorage.getItem('studentProfile');
    if (studentRaw) { setProfile({ type: 'student', data: JSON.parse(studentRaw) }); }
    else { const parentRaw = localStorage.getItem('parentProfile'); if (parentRaw) setProfile({ type: 'parent', data: JSON.parse(parentRaw) }); }
    setLoading(false);
  }, []);

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <p className="text-center text-gray-500 py-12">No profile data</p>;
  return profile.type === 'parent' ? <ParentProfileCard profile={profile.data} /> : <StudentProfileCard profile={profile.data} />;
}

function ParentProfileCard({ profile }: { profile: ParentProfile }) {
  const theme = getOrgThemeColor();
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="h-1.5" style={{ background: theme ? `linear-gradient(90deg, ${theme}, ${theme}aa)` : undefined }} />
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-md"
              style={{ background: theme || undefined }}>
              {!theme && <span className="bg-primary-600 w-full h-full flex items-center justify-center rounded-2xl">{profile.name.charAt(0).toUpperCase()}</span>}
              {theme && profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
              <p className="text-sm text-gray-500">Parent Account</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="WhatsApp Number" value={profile.whatsappNo} />
            <InfoRow label="Phone" value={profile.phone} fallback="Not provided" />
            <InfoRow label="Email" value={profile.email} fallback="Not provided" />
            <InfoRow label="Member Since" value={profile.createdAt ? formatDate(profile.createdAt) : null} fallback="—" />
          </div>
        </CardContent>
      </Card>

      {profile.children.length > 0 && (
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Linked Children ({profile.children.length})</h3></CardHeader>
          <CardContent className="space-y-3">
            {profile.children.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: theme || undefined }}>
                    {!theme && <span className="bg-primary-600 w-full h-full flex items-center justify-center rounded-xl">{child.firstName.charAt(0)}{child.lastName.charAt(0)}</span>}
                    {theme && `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{child.firstName} {child.lastName}</p>
                    <p className="text-xs text-gray-500">{child.class?.name ?? '—'} · {child.section?.name ?? '—'} · Roll #{child.rollNumber}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${child.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{child.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StudentProfileCard({ profile }: { profile: PortalStudentProfile }) {
  const theme = getOrgThemeColor();
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1.5" style={{ background: theme ? `linear-gradient(90deg, ${theme}, ${theme}aa)` : undefined }} />
      <CardContent className="p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-md"
            style={{ background: theme || undefined }}>
            {!theme && <span className="bg-primary-600 w-full h-full flex items-center justify-center rounded-2xl">{profile.firstName.charAt(0).toUpperCase()}</span>}
            {theme && profile.firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
            <p className="text-sm text-gray-500">Student Account</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Roll Number" value={profile.rollNumber} />
          <InfoRow label="School" value={profile.school?.name} />
          <InfoRow label="Class" value={profile.class?.name} />
          <InfoRow label="Section" value={profile.section?.name} />
          <InfoRow label="Parent WhatsApp" value={profile.parentWhatsapp} fallback="—" />
          <InfoRow label="Status" value={profile.status.replace('_', ' ')} valueClass={profile.isActive ? 'text-green-600' : 'text-red-600'} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value, fallback, valueClass }: { label: string; value?: string | null; fallback?: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-medium ${valueClass ?? (value ? 'text-gray-900' : 'text-gray-400')}`}>{value || fallback || '—'}</span>
    </div>
  );
}
