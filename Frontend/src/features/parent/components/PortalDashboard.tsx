'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { portalService, parentService } from '@/lib/api';
import { PARENT_PROFILE_UPDATED_EVENT } from '@/lib/api/parentService';
import { usePortalSocket } from '@/hooks/usePortalSocket';
import { portalLoginRedirect } from '@/lib/utils/orgTheme';
import type { PortalStudentProfile } from '@/lib/api/portalService';
import type { ParentProfile } from '@/lib/api/parentService';
import { ChildSummaryCard } from './portalCards';
import PortalShell from './PortalShell';
import type { PortalTab } from './parts/portalTabs';
import PortalTabHost from './parts/PortalTabHost';
import type { PortalChildBrief } from './parts/portalChildGroup';
import { OverviewSkeleton } from './parts/PortalSkeletonsA';

type SchoolInfo = { themeColor?: string | null; logoUrl?: string | null; slug?: string | null };

/** Org branding (theme + logo + slug) localStorage me save — logout par login?org= mile. */
function saveOrgBranding(school?: SchoolInfo | null) {
  if (typeof window === 'undefined' || !school?.themeColor && !school?.logoUrl) return;
  let prev: Record<string, unknown> = {};
  try { prev = JSON.parse(localStorage.getItem('organization') || '{}'); } catch { /* noop */ }
  localStorage.setItem('organization', JSON.stringify({
    ...prev,
    themeColor: school.themeColor ?? prev.themeColor ?? null,
    logoUrl: school.logoUrl ?? prev.logoUrl ?? null,
    slug: school.slug ?? prev.slug ?? null,
  }));
}

export default function PortalDashboard() {
  const router = useRouter();
  const isStudent = typeof window !== 'undefined' && Boolean(localStorage.getItem('studentToken'));
  const [student, setStudent] = useState<PortalStudentProfile | null>(null);
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [activeChildId, setActiveChildId] = useState('');
  const [tab, setTab] = useState<PortalTab>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (isStudent) {
          const s = await portalService.studentGetMe();
          setStudent(s);
          localStorage.setItem('studentProfile', JSON.stringify(s));
          saveOrgBranding(s.school);
        } else {
          const p = await parentService.getMe();
          setParent(p);
          localStorage.setItem('parentProfile', JSON.stringify(p));
          // Last-selected child restore karo (child switcher), warna pehla bacha.
          const saved = localStorage.getItem('activeChildId');
          const initial = p.children.some((c) => c.id === saved) ? saved : p.children[0]?.id;
          if (initial) {
            localStorage.setItem('activeChildId', initial);
            setActiveChildId(initial);
          }
          saveOrgBranding(p.children[0]?.school);
        }
      } catch { router.replace(portalLoginRedirect()); } finally { setLoading(false); }
    })();
  }, [isStudent, router]);

  // Parent photo/name update (header/upload) hone par profile refresh.
  useEffect(() => {
    if (isStudent) return;
    const reload = () => {
      parentService.getMe().then((p) => {
        setParent(p);
        localStorage.setItem('parentProfile', JSON.stringify(p));
      }).catch(() => {});
    };
    window.addEventListener(PARENT_PROFILE_UPDATED_EVENT, reload);
    return () => window.removeEventListener(PARENT_PROFILE_UPDATED_EVENT, reload);
  }, [isStudent]);

  const logout = useCallback(() => {
    localStorage.removeItem(isStudent ? 'studentToken' : 'parentToken');
    localStorage.removeItem(isStudent ? 'studentProfile' : 'parentProfile');
    router.push(portalLoginRedirect());
  }, [isStudent, router]);

  const children = (isStudent && student ? [student] : (parent?.children ?? [])) as Array<any>;
  const child = children.find((c) => c.id === activeChildId) ?? children[0];
  const briefs: PortalChildBrief[] = children.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    rollNumber: c.rollNumber,
    sectionId: c.section?.id,
    className: c.class?.name,
    sectionName: c.section?.name,
    imageUrl: c.imageUrl ?? null,
  }));
  const orgSchool = isStudent ? student?.school : (children[0]?.school ?? null);
  const orgName = orgSchool?.name ?? (isStudent ? 'Student Portal' : 'Parent Portal');
  const orgLogoUrl = orgSchool?.logoUrl ?? null;
  const avatarUrl = isStudent ? (student?.imageUrl ?? null) : (parent?.imageUrl ?? null);
  const title = isStudent ? 'Student Portal' : 'Parent Portal';
  const subtitle = isStudent
    ? `${student?.firstName ?? ''} ${student?.lastName ?? ''} · Roll #${student?.rollNumber ?? ''}`
    : `${parent?.name ?? ''} · ${parent?.whatsappNo ?? ''}`;

  const switchChild = useCallback((id: string) => {
    localStorage.setItem('activeChildId', id);
    setActiveChildId(id);
  }, []);

  const sectionIds = useMemo(
    () => [...new Set(children.map((c) => c.section?.id).filter(Boolean))],
    [children]
  );
  usePortalSocket(sectionIds, child?.school?.id);

  const shell = (content: React.ReactNode) => (
    <PortalShell active={tab} onChange={setTab} title={title} subtitle={subtitle} avatarUrl={avatarUrl} onLogout={logout}
      orgName={orgName} orgLogoUrl={orgLogoUrl} canEditPhoto={!isStudent}
      childList={!isStudent && children.length > 1 ? briefs : undefined}
      activeChildId={!isStudent ? activeChildId : undefined}
      onChildChange={!isStudent ? switchChild : undefined}
    >
      {content}
    </PortalShell>
  );

  if (loading) return shell(<OverviewSkeleton />);
  if (!student && !parent) return null;

  return shell(
    <>
      {children.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">No linked profiles found.</div>
      ) : (
        <>
          <div className="mb-6">
            <ChildSummaryCard firstName={child.firstName} lastName={child.lastName} imageUrl={child.imageUrl} schoolName={child.school?.name}
              className={child.class?.name} sectionName={child.section?.name} rollNumber={child.rollNumber}
              status={child.status} isActive={child.isActive} />
          </div>
          <PortalTabHost tab={tab} activeChildId={activeChildId} children={briefs} onChildChange={!isStudent ? switchChild : undefined} />
        </>
      )}
    </>
  );
}