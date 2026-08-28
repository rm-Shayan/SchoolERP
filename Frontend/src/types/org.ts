import type { OrgStatus, Role, SchoolStatus } from './core';
export interface Organization {
  id: string;
  name: string;
  slug: string;
  code: string;
  logoUrl?: string | null;
  themeColor?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  bankName?: string | null; // fee voucher par print hota hai
  bankAccountTitle?: string | null;
  bankAccountNumber?: string | null;
  adminUsername?: string | null;
  status?: OrgStatus;
  blockedBranchCount?: number;
  blockedReason?: string;
  blockedByName?: string;
  revenue?: number;
  createdAt: string;
  _count?: { branches: number; users: number; students?: number };
}

export interface OrganizationOverviewItem {
  id: string;
  name: string;
  slug: string;
  code: string;
  logoUrl?: string | null;
  themeColor?: string | null;
  status: OrgStatus;
  blockedBranchCount: number;
  createdAt: string;
  schoolCount: number;
  userCount: number;
  studentCount: number;
  revenue: number;
}

export interface PlatformOverview {
  stats: {
    totalOrganizations: number;
    totalSchools: number;
    totalStudents: number;
    totalStaffUsers: number;
    activeStudents: number;
    totalRevenue: number;
    active: number;
    blocked: number;
    partiallyBlocked: number;
    setupPending: number;
  };
  growth: { key: string; label: string; count: number }[];
  organizations: OrganizationOverviewItem[];
}

export interface SchoolAdmin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
}
export interface School {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  logoUrl?: string | null;
  themeColor?: string | null;
  status?: SchoolStatus;
  monthlyFeeDueDay?: number; // har month voucher ka default due day (e.g. 10 = 10th)
  attendanceStartTime?: string; // attendance marking start (HH:MM, 24hr)
  attendanceCutoffTime?: string; // late cutoff — iske baad unmarked students LATE (HH:MM, 24hr)
  attendanceAbsentTime?: string; // absent cutoff — iske baad unmarked students ABSENT (HH:MM, 24hr)
  attendanceAlertTime?: string; // jab attendance alerts messages jayen (HH:MM, 24hr)
  bankName?: string | null; // branch bank override — null = org default
  bankAccountTitle?: string | null;
  bankAccountNumber?: string | null;
  blockedReason?: string;
  blockedByName?: string;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
  admins?: SchoolAdmin[];
  _count?: { students: number; classes: number; users?: number };
}
