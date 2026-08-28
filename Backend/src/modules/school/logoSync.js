/**
 * Branch logo replacement rules (spec §3 + §5).
 *
 * The rule is extracted from `SchoolService.update` and all side effects are
 * injected so it can be unit-tested in isolation (no DB / Redis / Cloudinary):
 *
 * - `countBranches()`      → number of branches the org currently has
 * - `deleteImage(url)`     → best-effort storage cleanup (must never throw)
 * - `hasSamePublicId(a,b)` → true when both URLs are the SAME Cloudinary
 *   asset — the upload already overwrote it, so deleting it would destroy
 *   the just-uploaded replacement.
 *
 * Rules implemented:
 * - Rule 5: a replaced branch image is deleted from storage so old versions
 *   never pile up on the 25GB Cloudinary plan.
 * - Case A: the org has exactly ONE branch → the branch *is* the org
 *   visually, so the org image is synced to the new branch logo.
 * - Case B: the org has 2+ branches → the org image is left untouched;
 *   only the Super Admin may change it.
 * - Removing a branch logo (null) never touches the org image.
 *
 * @param {object}  args
 * @param {object}  args.school         school row incl. `logoUrl` + `organization.logoUrl`
 * @param {string|null} args.newLogoUrl new branch logo URL being saved
 * @param {Function} args.countBranches async () => number
 * @param {Function} args.deleteImage   async (url) => void
 * @param {Function} args.hasSamePublicId (a, b) => boolean
 * @returns {Promise<{ orgImageSync: string | null }>} logoUrl to persist on the
 *   organization (null → leave the org image alone).
 */
export async function resolveBranchLogoReplace({
  school,
  newLogoUrl,
  countBranches,
  deleteImage,
  hasSamePublicId,
}) {
  if (newLogoUrl === undefined || newLogoUrl === school.logoUrl) {
    return { orgImageSync: null };
  }

  // Rule 5 — remove the replaced branch image (unless the new upload already
  // overwrote the same Cloudinary asset).
  if (school.logoUrl && !hasSamePublicId(school.logoUrl, newLogoUrl)) {
    await deleteImage(school.logoUrl);
  }

  // Only a real image triggers the sync decision. Removing the branch logo
  // (null) never changes the org image.
  if (!newLogoUrl) {
    return { orgImageSync: null };
  }

  const branchCount = await countBranches();
  if (branchCount !== 1) {
    // Case B — multi-branch org: the org image belongs to the Super Admin.
    return { orgImageSync: null };
  }

  // Case A — single-branch org: keep the org image in sync with the branch.
  const org = school.organization;
  if (!org || org.logoUrl === newLogoUrl) {
    return { orgImageSync: null };
  }
  if (org.logoUrl && !hasSamePublicId(org.logoUrl, newLogoUrl)) {
    await deleteImage(org.logoUrl);
  }
  return { orgImageSync: newLogoUrl };
}
