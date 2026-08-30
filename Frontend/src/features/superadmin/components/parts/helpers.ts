import type { Organization, PlatformOverview, School, User } from '@/types';
import type { PlatformUserDirectory } from '@/lib/api/staffService';

export function filterBranches(schools: School[], search: string): School[] {
  const q = search.trim().toLowerCase();
  if (!q) return schools;
  return schools.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.organization?.name ?? '').toLowerCase().includes(q) ||
      (s.address ?? '').toLowerCase().includes(q)
  );
}

export function filterOrgs(orgs: Organization[], search: string): Organization[] {
  const q = search.trim().toLowerCase();
  if (!q) return orgs;
  return orgs.filter(
    (o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
  );
}

export function computeOrgsTotals(orgs: Organization[]) {
  return orgs.reduce(
    (acc, o) => ({
      totalBranches: acc.totalBranches + (o._count?.branches ?? 0),
      totalStaff: acc.totalStaff + (o._count?.users ?? 0),
    }),
    { totalBranches: 0, totalStaff: 0 }
  );
}

export const ROLES = ['ADMIN', 'RECEPTIONIST', 'TEACHER', 'SUPER_ADMIN'];
export const PAGE_SIZE = 10;
export const ROLE_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  SUPER_ADMIN: 'info',
  ADMIN: 'warning',
  TEACHER: 'success',
  RECEPTIONIST: 'default',
};

export function filterUsers(
  data: PlatformUserDirectory | null,
  search: string,
  roleFilter: string,
  statusFilter: string,
  reasonFilter: string
): User[] {
  if (!data) return [];
  const q = search.trim().toLowerCase();
  return data.items.filter((u) => {
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q) ||
      (u.organization?.name ?? '').toLowerCase().includes(q) ||
      (u.school?.name ?? '').toLowerCase().includes(q);
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus =
      !statusFilter || (statusFilter === 'ACTIVE' ? u.isActive : !u.isActive);
    const matchesReason =
      !reasonFilter || (reasonFilter === 'WITH_REASON' ? Boolean(u.blockedReason) : !u.blockedReason);
    return matchesSearch && matchesRole && matchesStatus && matchesReason;
  });
}

export function getPageItems(items: User[], page: number): User[] {
  return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

export interface ChartRow {
  name: string;
  Branches: number;
  Students: number;
  Staff: number;
}

export const CHART_COLORS = ['#7c3aed', '#f59e0b', '#10b981'];

let overviewCache: PlatformOverview | null = null;
export function getCachedOverview() {
  return overviewCache;
}
export function setCachedOverview(data: PlatformOverview | null) {
  overviewCache = data;
}

export function buildChartData(overview: PlatformOverview | null): ChartRow[] {
  return (overview?.organizations ?? []).map((o) => ({
    name: o.code,
    Branches: o.schoolCount,
    Students: o.studentCount,
    Staff: o.userCount,
  }));
}

export interface EditOrgFormValues {
  name: string;
  code: string;
  logoUrl: string;
  themeColor: string;
  adminUsername: string;
  phone: string;
  email: string;
  website: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
}

const t = (v: string) => v.trim() || undefined;

export function orgUpdatePayload(v: EditOrgFormValues) {
  return {
    name: v.name,
    code: v.code,
    logoUrl: v.logoUrl || undefined,
    themeColor: v.themeColor || undefined,
    adminUsername: t(v.adminUsername),
    phone: t(v.phone),
    email: t(v.email),
    website: t(v.website),
    facebookUrl: t(v.facebookUrl),
    instagramUrl: t(v.instagramUrl),
    twitterUrl: t(v.twitterUrl),
    youtubeUrl: t(v.youtubeUrl),
    // Empty string → null (field clear), value → save
    bankName: v.bankName.trim() || null,
    bankAccountTitle: v.bankAccountTitle.trim() || null,
    bankAccountNumber: v.bankAccountNumber.trim() || null,
  };
}
