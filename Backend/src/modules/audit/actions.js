// ==========================================
// AUDIT ACTION NAMES
// Central registry so every module logs the
// same action strings (Activity Log filters by them).
// ==========================================

export const AUDIT_ACTIONS = {
  // Auth
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  PARENT_LOGIN: "PARENT_LOGIN",
  STUDENT_LOGIN: "STUDENT_LOGIN",

  // Organization lifecycle
  CREATE_ORG: "CREATE_ORG",
  UPDATE_ORG: "UPDATE_ORG",
  DELETE_ORG: "DELETE_ORG",

  // Branch lifecycle
  CREATE_SCHOOL: "CREATE_SCHOOL",
  UPDATE_SCHOOL: "UPDATE_SCHOOL",
  DELETE_SCHOOL: "DELETE_SCHOOL",
  ASSIGN_SCHOOL_ADMIN: "ASSIGN_SCHOOL_ADMIN",

  // Staff lifecycle
  CREATE_STAFF: "CREATE_STAFF",
  UPDATE_STAFF: "UPDATE_STAFF",
  DEACTIVATE_STAFF: "DEACTIVATE_STAFF",
  REACTIVATE_STAFF: "REACTIVATE_STAFF",
  RESET_STAFF_PASSWORD: "RESET_STAFF_PASSWORD",

  // Moderation / blocking
  BLOCK_ORG: "BLOCK_ORG",
  UNBLOCK_ORG: "UNBLOCK_ORG",
  BLOCK_SCHOOL: "BLOCK_SCHOOL",
  UNBLOCK_SCHOOL: "UNBLOCK_SCHOOL",
  BLOCK_USER: "BLOCK_USER",
  UNBLOCK_USER: "UNBLOCK_USER",
  BLOCK_STUDENT: "BLOCK_STUDENT",
  UNBLOCK_STUDENT: "UNBLOCK_STUDENT",
  DELETE_STUDENT: "DELETE_STUDENT", // hard delete — permanent, overrides archive-only rule
  BLOCK_PARENT: "BLOCK_PARENT",
  UNBLOCK_PARENT: "UNBLOCK_PARENT",

  // Attendance data hygiene
  CLEANUP_ATTENDANCE: "CLEANUP_ATTENDANCE", // phantom duplicate attendance records deleted
};

// Display labels for the frontend Activity Log.
export const AUDIT_ACTION_LABELS = {
  [AUDIT_ACTIONS.LOGIN]: "Staff login",
  [AUDIT_ACTIONS.LOGOUT]: "Staff logout",
  [AUDIT_ACTIONS.PARENT_LOGIN]: "Parent login",
  [AUDIT_ACTIONS.STUDENT_LOGIN]: "Student login",
  [AUDIT_ACTIONS.CREATE_ORG]: "Organization created",
  [AUDIT_ACTIONS.UPDATE_ORG]: "Organization updated",
  [AUDIT_ACTIONS.DELETE_ORG]: "Organization deleted",
  [AUDIT_ACTIONS.CREATE_SCHOOL]: "Branch created",
  [AUDIT_ACTIONS.UPDATE_SCHOOL]: "Branch updated",
  [AUDIT_ACTIONS.DELETE_SCHOOL]: "Branch deleted",
  [AUDIT_ACTIONS.ASSIGN_SCHOOL_ADMIN]: "Branch admin assigned",
  [AUDIT_ACTIONS.CREATE_STAFF]: "Staff account created",
  [AUDIT_ACTIONS.UPDATE_STAFF]: "Staff account updated",
  [AUDIT_ACTIONS.DEACTIVATE_STAFF]: "Staff deactivated",
  [AUDIT_ACTIONS.REACTIVATE_STAFF]: "Staff reactivated",
  [AUDIT_ACTIONS.RESET_STAFF_PASSWORD]: "Staff password reset",
  [AUDIT_ACTIONS.BLOCK_ORG]: "Organization blocked",
  [AUDIT_ACTIONS.UNBLOCK_ORG]: "Organization unblocked",
  [AUDIT_ACTIONS.BLOCK_SCHOOL]: "Branch blocked",
  [AUDIT_ACTIONS.UNBLOCK_SCHOOL]: "Branch unblocked",
  [AUDIT_ACTIONS.BLOCK_USER]: "Staff blocked",
  [AUDIT_ACTIONS.UNBLOCK_USER]: "Staff unblocked",
  [AUDIT_ACTIONS.BLOCK_STUDENT]: "Student blocked",
  [AUDIT_ACTIONS.UNBLOCK_STUDENT]: "Student unblocked",
  [AUDIT_ACTIONS.DELETE_STUDENT]: "Student permanently deleted",
  [AUDIT_ACTIONS.BLOCK_PARENT]: "Parent blocked",
  [AUDIT_ACTIONS.UNBLOCK_PARENT]: "Parent unblocked",
  [AUDIT_ACTIONS.CLEANUP_ATTENDANCE]: "Phantom attendance records deleted",
};

// Entity types stored in AuditLog.entityType
export const AUDIT_ENTITY_TYPES = {
  ORGANIZATION: "ORGANIZATION",
  SCHOOL: "SCHOOL",
  USER: "USER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  AUTH: "AUTH",
};
