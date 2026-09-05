'use client';

import type { PortalTab } from './portalTabs';
import type { PortalChildBrief } from './portalChildGroup';
import OverviewTab from './OverviewTab';
import AttendanceTab from './AttendanceTab';
import FeesTab from './FeesTab';
import HomeworkTab from './HomeworkTab';
import NoticesTab from './NoticesTab';
import NotificationsTab from './NotificationsTab';
import ResultsTab from './ResultsTab';
import TimetableTab from './TimetableTab';
import ExamSheetTab from './ExamSheetTab';
import ConductTab from './ConductTab';
import PTMTab from './PTMTab';
import StudyMaterialsTab from './StudyMaterialsTab';
import PortalSettingsTab from './PortalSettingsTab';
import LeaveRequestsTab from './LeaveRequestsTab';
import PortalErrorBoundary from '@/components/PortalErrorBoundary';

const TAB_CONTENT: Record<Exclude<PortalTab, 'leave' | 'settings'>, React.FC<{ children?: PortalChildBrief[] }>> = {
  overview: OverviewTab, notifications: NotificationsTab, attendance: AttendanceTab, fees: FeesTab, homework: HomeworkTab,
  materials: StudyMaterialsTab, notices: NoticesTab, results: ResultsTab, exams: ExamSheetTab, timetable: TimetableTab, conduct: ConductTab,
  ptm: PTMTab,
};

interface PortalTabHostProps {
  tab: PortalTab;
  activeChildId: string;
  children: PortalChildBrief[];
  onChildChange?: (id: string) => void;
}

/** Active tab render karta hai. Key me selected child bhi hota hai taake
 *  child switch par tab remount ho aur naye child ka data fetch ho. */
export default function PortalTabHost({ tab, activeChildId, children, onChildChange }: PortalTabHostProps) {
  if (tab === 'leave') {
    return (
      <PortalErrorBoundary section="leave">
        <LeaveRequestsTab key={activeChildId} children={children} />
      </PortalErrorBoundary>
    );
  }
  if (tab === 'settings') {
    return (
      <PortalErrorBoundary section="settings">
        <PortalSettingsTab key={`settings:${activeChildId}`} activeChildId={activeChildId} onChildChange={onChildChange ?? (() => undefined)} />
      </PortalErrorBoundary>
    );
  }
  const TabContent = TAB_CONTENT[tab];
  return (
    <PortalErrorBoundary section={tab}>
      <TabContent key={`${tab}:${activeChildId}`} children={children} />
    </PortalErrorBoundary>
  );
}