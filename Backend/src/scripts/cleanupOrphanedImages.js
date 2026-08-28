/**
 * One-time cleanup: find and delete Cloudinary images that are no longer
 * referenced by any entity in the database.
 *
 * "Managed" images are everything under the `school-erp/` prefix
 * (org logos, branch logos, staff avatars, student photos). Any asset under
 * that prefix whose public_id does NOT appear in any live DB row is orphaned
 * (e.g. replaced images that leaked before the delete-old-on-replace rule, or
 * images whose org/branch was deleted without storage cleanup).
 *
 * Usage (run from Backend/):
 *   node --env-file=.env src/scripts/cleanupOrphanedImages.js          # DRY-RUN: reports, deletes nothing
 *   node --env-file=.env src/scripts/cleanupOrphanedImages.js --apply  # actually deletes orphans
 *
 * Dry-run is the default — production Cloudinary is never touched unless
 * `--apply` is passed explicitly.
 */
import prisma from "../config/db.js";
import storageService from "../services/storage.service.js";

const APPLY = process.argv.includes("--apply");
// Small pause every N deletes keeps us far under Cloudinary's API rate limit
// (~500 requests/minute) — the script runs at ~100 deletes/min worst case.
const PAUSE_EVERY = 100;
const PAUSE_MS = 1000;

/**
 * Collect the public_id of every image currently referenced by a live DB row.
 * Deduplicated (a single-branch org syncs its logo with the branch, so one
 * asset can be referenced by both rows).
 */
async function collectReferencedIds() {
  const ids = new Set();
  const add = (url) => {
    const id = storageService.extractPublicId(url);
    if (id) ids.add(id);
  };

  const [orgs, schools, users, students] = await Promise.all([
    prisma.organization.findMany({ select: { logoUrl: true } }),
    prisma.school.findMany({ select: { logoUrl: true } }),
    prisma.user.findMany({ select: { avatarUrl: true } }),
    prisma.student.findMany({ select: { imageUrl: true } }),
  ]);

  orgs.forEach((o) => add(o.logoUrl));
  schools.forEach((s) => add(s.logoUrl));
  users.forEach((u) => add(u.avatarUrl));
  students.forEach((s) => add(s.imageUrl));

  return ids;
}

async function main() {
  const ready = await storageService.waitForCloudinary();
  if (!ready) {
    console.error(
      "Cloudinary is not configured (CLOUDINARY_CLOUDNAME / API_KEY / API_SECRET missing) — nothing to do."
    );
    process.exit(1);
  }

  console.log(`Mode: ${APPLY ? "APPLY — orphans WILL be deleted" : "DRY-RUN — nothing will be deleted"}`);

  console.log("Collecting referenced images from DB...");
  const referenced = await collectReferencedIds();
  console.log(`Referenced images in DB: ${referenced.size}`);

  console.log("Listing managed images in Cloudinary (prefix school-erp/)...");
  const cloudImages = await storageService.listCloudinaryImages();
  console.log(`Images in Cloudinary: ${cloudImages.length}`);

  const orphans = cloudImages.filter((img) => !referenced.has(img.publicId));
  const orphanBytes = orphans.reduce((sum, o) => sum + (o.bytes || 0), 0);
  console.log(
    `Orphaned: ${orphans.length} image(s), ${(orphanBytes / (1024 * 1024)).toFixed(1)} MB reclaimable`
  );

  if (!APPLY) {
    orphans.slice(0, 10).forEach((o) => console.log(`  would delete: ${o.publicId}`));
    if (orphans.length > 10) console.log(`  ... and ${orphans.length - 10} more`);
    console.log("Dry-run complete — re-run with --apply to delete the orphaned image(s).");
    process.exit(0);
  }

  if (orphans.length === 0) {
    console.log("Nothing to delete.");
    process.exit(0);
  }

  let deleted = 0;
  let failed = 0;
  for (const [i, img] of orphans.entries()) {
    try {
      await storageService.deleteImage({ publicId: img.publicId });
      deleted += 1;
    } catch (err) {
      failed += 1;
      console.error(`  FAILED: ${img.publicId} — ${err.message}`);
    }
    if ((i + 1) % PAUSE_EVERY === 0) {
      console.log(`  progress: ${i + 1}/${orphans.length} (${deleted} deleted, ${failed} failed)`);
      await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
    }
  }

  console.log(`Done: ${deleted} deleted, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
