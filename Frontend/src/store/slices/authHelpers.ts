'use client';

import type { Organization, School, User } from '@/types';

export const getNestedOrg = (user: User): Organization | undefined => user.organization ?? undefined;
export const getNestedSchool = (user: User): School | undefined => user.school ?? undefined;

export function persistAuth(user: User | null, org: Organization | null | undefined, school: School | null | undefined) {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  if (org) localStorage.setItem('organization', JSON.stringify(org));
  if (school) localStorage.setItem('school', JSON.stringify(school));
}

// Har staff user apni branch se hi juda hota hai — nested school hi active
// school hai. fallback sirf tab use hota hai jab profile mein school na ho.
export const pickActiveSchool = (user: User, fallback?: School | null): School | null => {
  const nested = getNestedSchool(user);
  if (nested) return nested;
  if (user.schools && user.schools.length > 0) return user.schools[0];
  return fallback ?? null;
};
