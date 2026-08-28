import type { OrgStatus, SchoolStatus } from './core';

// ── Audit / Activity Log ─────────────────────────────────────
export type AuditAction =
  | 'LOGIN' | 'LOGOUT' | 'PARENT_LOGIN' | 'STUDENT_LOGIN'
  | 'CREATE_ORG' | 'UPDATE_ORG' | 'DELETE_ORG'
  | 'CREATE_SCHOOL' | 'UPDATE_SCHOOL' | 'DELETE_SCHOOL' | 'ASSIGN_SCHOOL_ADMIN'
  | 'CREATE_STAFF' | 'UPDATE_STAFF' | 'DEACTIVATE_STAFF' | 'REACTIVATE_STAFF' | 'RESET_STAFF_PASSWORD'
  | 'BLOCK_ORG' | 'UNBLOCK_ORG' | 'BLOCK_SCHOOL' | 'UNBLOCK_SCHOOL'
  | 'BLOCK_USER' | 'UNBLOCK_USER' | 'BLOCK_STUDENT' | 'UNBLOCK_STUDENT'
  | 'BLOCK_PARENT' | 'UNBLOCK_PARENT';

export type AuditEntityType = 'ORGANIZATION' | 'SCHOOL' | 'USER' | 'STUDENT' | 'PARENT' | 'AUTH';

export interface AuditLogEntry {
  id: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityName?: string;
  organizationId?: string;
  schoolId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogsResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Org dashboard (spec §3–§4) ────────────────────────────────
export interface OrgBranchStat {
  id: string;
  name: string;
  code: string;
  status: SchoolStatus;
  staffCount: number;
  studentCount: number;
  revenueSeries: number[];
}

export interface OrgDashboardRevenue {
  total: number;
  monthly: { key: string; label: string; total: number }[];
}

export interface OrgStaffRow {
  id: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED';
  isActive: boolean;
  blockedReason?: string;
  schoolId?: string;
  schoolName?: string;
  joinedAt: string;
}

export interface OrgDashboard {
  organization: {
    id: string;
    name: string;
    slug: string;
    code: string;
    logoUrl?: string | null;
    themeColor?: string | null;
    status: OrgStatus;
  };
  branches: OrgBranchStat[];
  revenue: OrgDashboardRevenue;
  staff: OrgStaffRow[];
}
