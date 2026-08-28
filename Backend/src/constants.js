// ==========================================
// ROLE CONSTANTS — Pakistani School Structure
// ==========================================

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",     // Platform owner — SaaS operator (SIRF 1, organizationId = null)
  ADMIN: "ADMIN",                 // Branch Head = Principal + Admin (one person in Pakistani schools)
  TEACHER: "TEACHER",             // Class Teacher / Subject Teacher / Section Incharge
  RECEPTIONIST: "RECEPTIONIST",   // Front Desk — admissions inquiry + gate scanning
};

// ==========================================
// ROLE GROUPS — For clean RBAC across modules
// ==========================================

export const ROLE_GROUPS = {
  // Full system control
  ALL_STAFF: ["SUPER_ADMIN", "ADMIN", "TEACHER", "RECEPTIONIST"],

  // Can manage the entire organization & all branches (sirf platform owner)
  ORG_LEVEL: ["SUPER_ADMIN"],

  // Branch administration (Principal + Admin = ADMIN in Pakistani schools)
  MANAGEMENT: ["SUPER_ADMIN", "ADMIN"],

  // Can manage staff accounts (create, update, deactivate)
  USER_MANAGERS: ["SUPER_ADMIN", "ADMIN"],

  // Finance-related access (handled by branch ADMIN/Principal)
  FINANCE: ["SUPER_ADMIN", "ADMIN"],

  // Academic functions
  ACADEMIC: ["SUPER_ADMIN", "ADMIN", "TEACHER"],

  // Attendance & gate access — receptionist scans at the gate
  ATTENDANCE: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST", "TEACHER"],

  // Admissions & front desk
  ADMISSIONS: ["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"],

  // Read-only dashboard access (all branch staff)
  BRANCH_STAFF: ["ADMIN", "TEACHER", "RECEPTIONIST"],
};

// ==========================================
// BLOCKING / MODERATION
// ==========================================

// Standard message shown to ANY role trying to log in to a blocked
// organization, branch, or user account (spec §2 — same message everywhere).
export const BLOCKED_MESSAGE =
  "Admin deactivated your portal. Please contact admin of this system.";

// ==========================================
// OTP CONSTANTS
// ==========================================

export const OTP = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  TYPE: {
    PARENT: "PARENT_LOGIN",
    STUDENT: "STUDENT_LOGIN",
  },
};

// ==========================================
// JWT CONSTANTS
// ==========================================

export const JWT = {
  ACCESS_EXPIRY: "1h",
  REFRESH_EXPIRY: "30d",
  REFRESH_EXPIRY_MS: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  PARENT_EXPIRY: "30d",   // Parents stay logged in longer (portal is read-only)
  STUDENT_EXPIRY: "30d",
};
