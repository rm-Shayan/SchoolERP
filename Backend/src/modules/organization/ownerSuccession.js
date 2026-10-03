/**
 * Organization owner succession — pure decision logic.
 *
 * Exactly one account per organization may hold org-level settings (name,
 * logo, theme, contact). When that account is deleted, deactivated or moved off
 * its branch, the org would be left with nobody able to edit itself, so the
 * flag is handed to the most senior remaining branch admin.
 *
 * Kept free of Prisma so the ranking rules can be tested directly; the
 * transactional write lives in provision.js.
 */

/** How many extra branches an admin can open (branchAccess is a Json array). */
export function countBranchAccess(branchAccess) {
  return Array.isArray(branchAccess) ? branchAccess.length : 0;
}

/**
 * Admins eligible to become owner: same org, ADMIN role, active, not blocked,
 * and not already the owner.
 */
export function isEligibleCandidate(user) {
  return Boolean(
    user &&
      user.role === "ADMIN" &&
      user.isActive === true &&
      !user.isOrganizationOwner &&
      !user.blockedAt
  );
}

/**
 * Pick the successor for org ownership, most capable first:
 *   1. Admins already managing several branches (`branchAccess`) — they are the
 *      ones who actually understand org-wide context.
 *   2. Otherwise the longest-serving admin (`createdAt`).
 * Ties break on `id ASC`, so the same admin is always chosen for the same data.
 *
 * Returns null when nobody is eligible (org stays on SUPER_ADMIN fallback).
 */
export function pickOwnerSuccessor(candidates) {
  const eligible = candidates.filter(isEligibleCandidate);
  if (eligible.length === 0) return null;

  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const byAge = (a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return at - bt;
  };

  return [...eligible].sort(
    (a, b) => countBranchAccess(b.branchAccess) - countBranchAccess(a.branchAccess) || byAge(a, b) || byId(a, b)
  )[0];
}