'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { portalService, parentService } from '@/lib/api';
import { notificationService } from '@/lib/api/notificationService';
import { usePortalSocket } from '@/hooks/usePortalSocket';
import type { PortalStudentProfile } from '@/lib/api/portalService';
import type { ParentProfile } from '@/lib/api/parentService';
import { AuthCenteredScreen, Loading } from '@/features/shared/components';
import { ChildSummaryCard, PortalBrandIcon, PortalHeader } from './portalCards';
import SiblingSelector from './SiblingSelector';
import PortalTabNav, { type PortalTab } from './parts/PortalTabNav';
import OverviewTab from './parts/OverviewTab';
import AttendanceTab from './parts/AttendanceTab';
import FeesTab from './parts/FeesTab';
import HomeworkTab from './parts/HomeworkTab';
import NoticesTab from './parts/NoticesTab';
import ResultsTab from './parts/ResultsTab';
import TimetableTab from './parts/TimetableTab';
import LeaveRequestsTab from './parts/LeaveRequestsTab';
import ProfileTab from './parts/ProfileTab';
import ConductTab from './parts/ConductTab';
import PTMTab from './parts/PTMTab';
import NotificationInboxTab from './parts/NotificationInboxTab';

const TAB_CONTENT: Record<PortalTab, React.FC> = {
  overview: OverviewTab, attendance: AttendanceTab, fees: FeesTab, homework: HomeworkTab,
  notices: NoticesTab, results: ResultsTab, timetable: TimetableTab, conduct: ConductTab,
  ptm: PTMTab, leave: () => null, notifications: NotificationInboxTab, profile: ProfileTab,
};

export default function PortalDashboard() {
  const router = useRouter();
  const isStudent = typeof window !== 'undefined' && Boolean(localStorage.getItem('studentToken'));
  const [student, setStudent] = useState<PortalStudentProfile | null>(null);
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [activeChildId, setActiveChildId] = useState('');
  const [tab, setTab] = useState<PortalTab>('overview');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        if (isStudent) {
          const s = await portalService.studentGetMe();
          setStudent(s);
          localStorage.setItem('studentProfile', JSON.stringify(s));
        } else {
          const p = await parentService.getMe();
          setParent(p);
          localStorage.setItem('parentProfile', JSON.stringify(p));
          if (p.children.length) setActiveChildId(p.children[0].id);
        }
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch { router.replace('/parent/login'); } finally { setLoading(false); }
    })();
  }, [isStudent, router]);

  const logout = useCallback(() => {
    localStorage.removeItem(isStudent ? 'studentToken' : 'parentToken');
    localStorage.removeItem(isStudent ? 'studentProfile' : 'parentProfile');
    router.push('/parent/login');
  }, [isStudent, router]);

  const children = (isStudent && student ? [student] : (parent?.children ?? [])) as Array<any>;
  const child = children.find((c) => c.id === activeChildId) ?? children[0];
  const title = isStudent ? 'Student Portal' : 'Parent Portal';
  const subtitle = isStudent
    ? `${student?.firstName ?? ''} ${student?.lastName ?? ''} · Roll #${student?.rollNumber ?? ''}`
    : `${parent?.name ?? ''} · ${parent?.whatsappNo ?? ''}`;

  const sectionIds = useMemo(
    () => [...new Set(children.map((c) => c.section?.id).filter(Boolean))],
    [children]
  );
  usePortalSocket(sectionIds, child?.school?.id);
  const TabContent = TAB_CONTENT[tab];

  if (loading) return (
    <AuthCenteredScreen variant="secondary" brandIcon={<PortalBrandIcon />} brandLabel="SchoolERP" brandSub={isStudent ? 'Student Portal' : 'Parent Portal'}>
      <Loading className="py-2" />
      <h1 className="text-xl font-bold text-slate-900">Loading your portal</h1>
    </AuthCenteredScreen>
  );
  if (!student && !parent) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <PortalHeader title={title} subtitle={subtitle} onLogout={logout} />
      <div className="max-w-4xl mx-auto">
        {children.length === 0 ? (
          <div className="m-4 rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">No linked profiles found.</div>
        ) : (
          <>
            <div className="px-4 pt-4">
              {!isStudent && children.length > 1 && (
                <SiblingSelector items={children} activeId={child.id} onChange={setActiveChildId} />
              )}
              <ChildSummaryCard firstName={child.firstName} lastName={child.lastName} schoolName={child.school?.name}
                className={child.class?.name} sectionName={child.section?.name} rollNumber={child.rollNumber}
                status={child.status} isActive={child.isActive} />
            </div>
            <PortalTabNav active={tab} onChange={setTab} unreadCount={unreadCount} />
            <div className="px-4 py-4">
              {tab === 'leave' ? (
                <LeaveRequestsTab children={children.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, rollNumber: c.rollNumber }))} />
              ) : (
                <TabContent key={`${tab}-${child.id}`} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
