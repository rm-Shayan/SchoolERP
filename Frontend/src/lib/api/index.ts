// Core
export { default as api } from './client';
export { setTokens, getAccessToken, getRefreshToken, clearAuth } from './client';
export { authService } from './authService';

// Domain Services
export { orgService } from './orgService';
export { schoolService } from './schoolService';
export { staffService } from './staffService';
export { academicService } from './academicService';
export { attendanceService } from './attendanceService';
export { admissionService } from './admissionService';
export { feeService } from './feeService';
export { studentService } from './studentService';
export { homeworkService } from './homeworkService';
export { examService } from './examService';
export { conductService } from './conductService';
export { circularService } from './circularService';
export { ptmService } from './ptmService';
export { timetableService } from './timetableService';
export { activityService } from './activityService';
export { notificationService } from './notificationService';
export { promotionService } from './promotionService';
export { parentService } from './parentService';
export { portalService } from './portalService';
export { portalDataService } from './portalDataService';
export { portalNotificationService } from './portalNotifications';
export { moderationService } from './moderationService';
export { auditLogService } from './auditLogService';
export { teachingAssignmentService } from './teachingAssignmentService';
export { smtpSettingsService } from './smtpSettingsService';
export { storageSettingsService } from './storageSettingsService';
export { leaveService } from './leaveService';
export { staffLeaveService } from './staffLeaveService';
export { staffAttendanceService } from './staffAttendanceService';
