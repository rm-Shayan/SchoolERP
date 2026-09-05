// RTK Query API — import this to get all hooks
import './timetableEndpoints';
import './teachingEndpoints';
import './homeworkEndpoints';
import './notificationEndpoints';
import './academicEndpoints';
import './staffEndpoints';
import './ptmEndpoints';
import './conductEndpoints';
import './examEndpoints';
import './authEndpoints';
import './studentEndpoints';
import './feeEndpoints';
import './admissionEndpoints';
import './circularEndpoints';
import './orgEndpoints';
import './schoolEndpoints';
import './moderationEndpoints';
import './auditEndpoints';
import './staffLeaveEndpoints';
import './staffAttEndpoints';
import './leaveEndpoints';
import './smtpEndpoints';
import './storageEndpoints';
import './promotionEndpoints';

export { api } from './api';

// Timetable
export { useGetByTeacherQuery, useGetBySectionQuery, useCreateSlotMutation, useDeleteSlotMutation, useClearAllSlotsMutation } from './timetableEndpoints';

// Teaching
export { useListMineAssignmentsQuery, useListTeachingAssignmentsQuery, useAssignTeachingMutation, useRemoveAssignmentMutation } from './teachingEndpoints';

// Homework
export { useListHomeworkQuery, useCreateHomeworkMutation } from './homeworkEndpoints';

// Notifications
export { usePortalNotificationsQuery, useUnreadCountQuery, useMarkReadMutation, useMarkAllReadMutation, useDeleteNotificationMutation } from './notificationEndpoints';

// Academic
export { useClassesBySchoolQuery, useYearsBySchoolQuery } from './academicEndpoints';

// Staff
export { useAllStaffQuery } from './staffEndpoints';

// PTM
export { usePtmBySchoolQuery } from './ptmEndpoints';

// Conduct
export { useConductMineQuery, useConductBySectionQuery } from './conductEndpoints';

// Exams
export { useExamsBySchoolQuery } from './examEndpoints';

// Auth
export { useGetMeQuery } from './authEndpoints';

// Students
export { useStudentsQuery, useStudentByIdQuery, useCreateStudentMutation, useUpdateStudentMutation, useDeleteStudentMutation } from './studentEndpoints';

// Fees
export { useFeeStructuresBySchoolQuery, useFeeRecordsQuery, useFeeSummaryQuery } from './feeEndpoints';

// Admissions
export { useAdmissionsQuery, useAdmissionByIdQuery } from './admissionEndpoints';

// Circulars
export { useCircularsBySchoolQuery } from './circularEndpoints';

// Organizations
export { useOrgsQuery, useOrgOverviewQuery, useOrgByIdQuery, useOrgDashboardQuery } from './orgEndpoints';

// Schools
export { useSchoolsQuery, useSchoolByIdQuery } from './schoolEndpoints';

// Moderation
export { useBlockOrgMutation, useUnblockOrgMutation, useBlockSchoolMutation, useUnblockSchoolMutation, useBlockUserMutation, useUnblockUserMutation, useBlockStudentMutation, useUnblockStudentMutation } from './moderationEndpoints';

// Audit
export { useAuditLogsQuery } from './auditEndpoints';

// Staff Leave
export { useStaffLeavesQuery } from './staffLeaveEndpoints';

// Staff Attendance
export { useStaffDailyAttendanceQuery } from './staffAttEndpoints';

// Student Leave
export { useLeaveRequestsQuery } from './leaveEndpoints';

// SMTP
export { useSmtpStatusQuery } from './smtpEndpoints';

// Storage
export { useStorageStatusQuery } from './storageEndpoints';

// Promotions
export { usePromotionsQuery } from './promotionEndpoints';
